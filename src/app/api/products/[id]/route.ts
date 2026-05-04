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

export const PUT = apiHandler(async (request: NextRequest, ctx?: { params: Record<string, string> }) => {
  const params = { id: ctx?.params?.id ?? "" };
  const supabase = getSupabaseWithAuth(request);
  const body = await request.json();
  const { name, category, description, image_url, variants } = body;
  const productId = params.id;

  const { error: productError } = await supabase
    .from("products")
    .update({ name, category, description, image_url })
    .eq("id", productId);

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });

  // Load existing variants to avoid deleting those referenced by order_items
  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("id, name")
    .eq("product_id", productId);

  const existingMap = new Map((existingVariants ?? []).map((v) => [v.name, v.id]));
  const incomingNames = new Set(variants.map((v: { name: string }) => v.name));

  // Soft-deactivate variants that were removed (can't delete if referenced by order_items)
  for (const existing of existingVariants ?? []) {
    if (!incomingNames.has(existing.name)) {
      await supabase
        .from("product_variants")
        .update({ is_active: false })
        .eq("id", existing.id);
    }
  }

  for (const variant of variants) {
    let variantId = existingMap.get(variant.name);

    if (variantId) {
      // Update existing variant
      const { error: updateError } = await supabase
        .from("product_variants")
        .update({ base_price: variant.base_price, is_active: true })
        .eq("id", variantId);
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    } else {
      // Insert new variant
      const { data: newVariant, error: insertError } = await supabase
        .from("product_variants")
        .insert({ product_id: productId, name: variant.name, base_price: variant.base_price })
        .select()
        .single();
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
      variantId = newVariant.id;
    }

    // recipes and branch_prices are config — safe to delete and recreate
    await supabase.from("branch_prices").delete().eq("variant_id", variantId);
    await supabase.from("recipes").delete().eq("variant_id", variantId);

    if (variant.branch_prices?.length) {
      await supabase.from("branch_prices").insert(
        variant.branch_prices.map((bp: { branch_id: string; price: number }) => ({
          branch_id: bp.branch_id,
          variant_id: variantId,
          price: bp.price,
        }))
      );
    }

    if (variant.recipes?.length) {
      await supabase.from("recipes").insert(
        variant.recipes.map((r: { ingredient_id: string; quantity: number; apply_condition?: string }) => ({
          variant_id: variantId,
          ingredient_id: r.ingredient_id,
          quantity: r.quantity,
          apply_condition: r.apply_condition ?? "always",
        }))
      );
    }
  }

  return NextResponse.json({ success: true });
});

export const PATCH = apiHandler(async (request: NextRequest, ctx?: { params: Record<string, string> }) => {
  const supabase = getSupabaseWithAuth(request);
  const { is_active } = await request.json();
  const id = ctx?.params?.id ?? "";

  // Cascade to variants
  const { error: variantError } = await supabase
    .from("product_variants")
    .update({ is_active })
    .eq("product_id", id);

  if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 });

  const { error } = await supabase
    .from("products")
    .update({ is_active })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
});

export const DELETE = apiHandler(async (request: NextRequest, ctx?: { params: Record<string, string> }) => {
  // Soft delete — cascades to variants
  const supabase = getSupabaseWithAuth(request);
  const id = ctx?.params?.id ?? "";

  await supabase
    .from("product_variants")
    .update({ is_active: false })
    .eq("product_id", id);

  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
});
