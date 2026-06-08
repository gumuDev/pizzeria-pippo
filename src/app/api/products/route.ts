import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiHandler } from "@/lib/api-handler";

function getSupabaseWithAuth(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

const PAGE_SIZE = 10;

export const GET = apiHandler(async (request: NextRequest) => {
  const supabase = getSupabaseWithAuth(request);
  const params = new URL(request.url).searchParams;
  const showInactive = params.get("showInactive") === "true";
  const branchId = params.get("branchId");
  const search = params.get("search") ?? "";
  const page = parseInt(params.get("page") ?? "1", 10);
  const pageSize = parseInt(params.get("pageSize") ?? String(PAGE_SIZE), 10);

  // POS fetches all (no pagination needed — cached client-side)
  const isPOS = !!branchId;

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
  if (!isPOS) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (isPOS) {

    // POS: attach stock_quantity for resale variants
    const resaleVariantIds = (data ?? []).flatMap((p) =>
      p.product_type === "resale"
        ? (p.product_variants ?? []).map((v: { id: string }) => v.id)
        : []
    );

    if (resaleVariantIds.length > 0) {
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: stockRows } = await serviceSupabase
        .from("branch_product_stock")
        .select("variant_id, quantity")
        .eq("branch_id", branchId)
        .in("variant_id", resaleVariantIds);

      const stockMap: Record<string, number> = {};
      for (const row of stockRows ?? []) stockMap[row.variant_id] = row.quantity;

      for (const product of data ?? []) {
        for (const variant of product.product_variants ?? []) {
          if (product.product_type === "resale") {
            variant.stock_quantity = stockMap[variant.id] ?? null;
          }
        }
      }
    }

    return NextResponse.json(data);
  }

  // Admin: return paginated
  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const supabase = getSupabaseWithAuth(request);
  const body = await request.json();
  const { name, category, description, image_url, product_type, variants } = body;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ name, category, description, image_url, product_type: product_type ?? "made" })
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
