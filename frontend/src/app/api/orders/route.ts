import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { ConflictError, ValidationError } from "@/lib/errors";
import { createAuthClient, createServiceClient } from "@/lib/supabase-server";
import { dateRangeFrom, dateRangeTo, todayInBolivia } from "@/lib/timezone";
import {
  applyPromotions,
  getActivePromotions,
  getCartTotal,
  type CartItem,
  type Promotion,
} from "@/lib/promotions";
import { computeStockDeductions, type RecipeRow } from "@/lib/order-stock";
import { notifyLowStock } from "@/lib/recipes";

const orderPayloadSchema = z.object({
  branch_id: z.uuid(),
  total: z.number().nonnegative(),
  payment_method: z.enum(["efectivo", "qr"]).nullish(),
  order_type: z.enum(["dine_in", "takeaway"]),
  idempotency_key: z.string().min(8).max(64).nullish(),
  items: z
    .array(
      z.object({
        variant_id: z.uuid(),
        qty: z.number().int().positive(),
        flavors: z
          .array(
            z.object({
              variant_id: z.uuid(),
              proportion: z.number().positive().max(1),
              product_name: z.string().optional(),
            })
          )
          .nullish(),
      })
    )
    .min(1)
    .max(100),
});

interface VariantRow {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
  branch_prices: { branch_id: string; price: number }[] | null;
  recipes: RecipeRow[] | null;
  products: { name: string; category: string; product_type: string | null; is_active: boolean } | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const POST = apiHandler(async (request: NextRequest) => {
  const { userId } = await createAuthClient(request);

  const parsed = orderPayloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Payload inválido");
  }
  const { branch_id, total: clientTotal, payment_method, order_type, idempotency_key, items } = parsed.data;

  const supabase = createServiceClient();

  // 1. Fetch variants (including mixed-pizza flavors) with prices, recipes and product info
  const flavorVariantIds = items.flatMap((i) => (i.flavors ?? []).map((f) => f.variant_id));
  const variantIds = Array.from(new Set(items.map((i) => i.variant_id).concat(flavorVariantIds)));

  const { data: variantRows, error: variantsError } = await supabase
    .from("product_variants")
    .select(
      "id, name, base_price, is_active, branch_prices(branch_id, price), recipes(ingredient_id, quantity, apply_condition), products(name, category, product_type, is_active)"
    )
    .in("id", variantIds);
  if (variantsError) return NextResponse.json({ error: variantsError.message }, { status: 500 });

  const variants = (variantRows ?? []) as unknown as VariantRow[];
  const variantById = new Map(variants.map((v) => [v.id, v]));

  // 2. Server-side price resolution — never trust client prices
  const cart: CartItem[] = items.map((i) => {
    const variant = variantById.get(i.variant_id);
    if (!variant || !variant.is_active || !variant.products?.is_active) {
      throw new ValidationError("Hay productos no disponibles en el pedido");
    }
    const override = variant.branch_prices?.find((bp) => bp.branch_id === branch_id);
    const productType = variant.products?.product_type ?? "made";
    if (!override && productType !== "resale") {
      throw new ValidationError(`"${variant.products?.name ?? variant.name}" no tiene precio en esta sucursal`);
    }
    return {
      variant_id: i.variant_id,
      qty: i.qty,
      unit_price: override ? override.price : variant.base_price,
      product_name: variant.products?.name ?? "",
      variant_name: variant.name,
      category: variant.products?.category ?? "",
      flavors: i.flavors?.length
        ? i.flavors.map((f) => ({
            variant_id: f.variant_id,
            product_name: f.product_name ?? "",
            proportion: f.proportion,
          }))
        : undefined,
    };
  });

  // 3. Recompute promotions and totals server-side
  const { data: promoRows, error: promoError } = await supabase
    .from("promotions")
    .select("*, promotion_rules(*)")
    .eq("is_active", true);
  if (promoError) return NextResponse.json({ error: promoError.message }, { status: 500 });

  const activePromotions = getActivePromotions((promoRows ?? []) as Promotion[], branch_id);
  const discounted = applyPromotions(cart, activePromotions);
  const serverTotal = round2(getCartTotal(discounted));

  // 4. The client total must match — a mismatch means prices/promos changed (or were tampered)
  if (Math.abs(serverTotal - clientTotal) > 0.01) {
    throw new ConflictError("Los precios o promociones cambiaron. Actualizá el catálogo e intentá de nuevo.");
  }

  // 5. Compute stock deductions (pure, tested in lib/order-stock.test.ts)
  const recipesByVariant: Record<string, RecipeRow[]> = {};
  for (const v of variants) recipesByVariant[v.id] = v.recipes ?? [];

  const deductions = computeStockDeductions(
    discounted.map((d) => ({
      variant_id: d.variant_id,
      qty_physical: d.qty_physical,
      product_type: variantById.get(d.variant_id)?.products?.product_type ?? "made",
      flavors: d.flavors?.map((f) => ({ variant_id: f.variant_id, proportion: f.proportion })),
    })),
    recipesByVariant,
    order_type
  );

  // 6. Apply order + items + flavors + stock in ONE transaction
  const today = todayInBolivia();
  const { data: result, error: rpcError } = await supabase.rpc("create_order_atomic", {
    payload: {
      branch_id,
      cashier_id: userId,
      total: serverTotal,
      payment_method: payment_method ?? null,
      order_type,
      idempotency_key: idempotency_key ?? null,
      day_start: dateRangeFrom(today),
      day_end: dateRangeTo(today),
      items: discounted.map((d) => ({
        variant_id: d.variant_id,
        qty: d.qty,
        qty_physical: d.qty_physical,
        unit_price: d.unit_price,
        discount_applied: round2(d.discount_applied),
        promo_label: d.promo_label,
        flavors: (d.flavors ?? []).map((f) => ({ variant_id: f.variant_id, proportion: f.proportion })),
      })),
      ...deductions,
    },
  });
  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

  // 7. Low-stock Telegram alert — fire-and-forget, outside the transaction
  notifyLowStock(branch_id, deductions.ingredient_deductions.map((d) => d.ingredient_id));

  return NextResponse.json(
    { order_id: result.order_id, daily_number: result.daily_number },
    { status: result.duplicate ? 200 : 201 }
  );
});
