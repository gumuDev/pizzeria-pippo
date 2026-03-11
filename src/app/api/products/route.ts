import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseWithAuth(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  const showInactive = new URL(request.url).searchParams.get("showInactive") === "true";

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
    `)
    .order("name", { ascending: true });

  if (!showInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  const body = await request.json();
  const { name, category, description, image_url, variants } = body;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({ name, category, description, image_url })
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
}
