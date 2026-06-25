import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { createAuthClient, createServiceClient } from "@/lib/supabase-server";

const PAGE_SIZE = 10;

export const GET = apiHandler(async (request: NextRequest) => {
  const { client: authClient } = await createAuthClient(request);
  const params = new URL(request.url).searchParams;
  const showInactive = params.get("showInactive") === "true";
  const branchId = params.get("branchId");
  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const page = parseInt(params.get("page") ?? "1", 10);
  const pageSize = parseInt(params.get("pageSize") ?? String(PAGE_SIZE), 10);

  // POS fetches all (no pagination needed — cached client-side)
  const isPOS = !!branchId;

  // Use service client when showInactive=true so RLS doesn't filter out
  // inactive product_variants in the nested select
  const supabase = showInactive ? createServiceClient() : authClient;

  let query = supabase
    .from("products")
    .select(`
      *,
      product_variants (
        *,
        branch_prices (*),
        recipes (
          *,
          ingredients (id, name, unit)
        )
      )
    `, { count: isPOS ? undefined : "exact" })
    .order("name", { ascending: true });

  if (!showInactive) query = query.eq("is_active", true);
  if (search) query = query.ilike("name", `%${search}%`);
  if (category) query = query.eq("category", category);
  if (!isPOS) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isPOS) {
    // Made products are only sold where they have a registered branch price:
    // keep variants priced for this branch, drop products left without variants
    const posProducts = (data ?? [])
      .map((p) => {
        if (p.product_type === "resale") return p;
        return {
          ...p,
          product_variants: (p.product_variants ?? []).filter(
            (v: { branch_prices?: { branch_id: string }[] }) =>
              (v.branch_prices ?? []).some((bp) => bp.branch_id === branchId)
          ),
        };
      })
      .filter((p) => p.product_type === "resale" || (p.product_variants ?? []).length > 0);

    // POS: attach stock_quantity for resale variants
    const resaleVariantIds = posProducts.flatMap((p) =>
      p.product_type === "resale"
        ? (p.product_variants ?? []).map((v: { id: string }) => v.id)
        : []
    );

    if (resaleVariantIds.length > 0) {
      const serviceSupabase = createServiceClient();
      const { data: stockRows } = await serviceSupabase
        .from("branch_product_stock")
        .select("variant_id, quantity")
        .eq("branch_id", branchId)
        .in("variant_id", resaleVariantIds);

      const stockMap: Record<string, number> = {};
      for (const row of stockRows ?? []) stockMap[row.variant_id] = row.quantity;

      for (const product of posProducts) {
        for (const variant of product.product_variants ?? []) {
          if (product.product_type === "resale") {
            variant.stock_quantity = stockMap[variant.id] ?? null;
          }
        }
      }
    }

    return NextResponse.json(posProducts);
  }

  // Admin: return paginated
  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const { client: supabase } = await createAuthClient(request);
  const body = await request.json();
  const { name, category, description, image_url, product_type, track_stock, variants } = body;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ name, category, description, image_url, product_type: product_type ?? "made", track_stock: track_stock ?? true })
    .select()
    .single();

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });

  for (const variant of variants) {
    const { data: createdVariant, error: variantError } = await supabase
      .from("product_variants")
      .insert({ product_id: product.id, name: variant.name, base_price: variant.base_price })
      .select()
      .single();

    if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 });

    if (variant.branch_prices?.length) {
      const { error: priceError } = await supabase
        .from("branch_prices")
        .insert(variant.branch_prices.map((bp: { branch_id: string; price: number }) => ({
          branch_id: bp.branch_id,
          variant_id: createdVariant.id,
          price: bp.price,
        })));
      if (priceError) return NextResponse.json({ error: priceError.message }, { status: 500 });
    }

    if (variant.recipes?.length) {
      const { error: recipeError } = await supabase
        .from("recipes")
        .insert(variant.recipes.map((r: { ingredient_id: string; quantity: number; apply_condition?: string }) => ({
          variant_id: createdVariant.id,
          ingredient_id: r.ingredient_id,
          quantity: r.quantity,
          apply_condition: r.apply_condition ?? "always",
        })));
      if (recipeError) return NextResponse.json({ error: recipeError.message }, { status: 500 });
    }
  }

  return NextResponse.json(product, { status: 201 });
});
