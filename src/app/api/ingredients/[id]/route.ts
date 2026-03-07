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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseWithAuth(request);
  const { is_active } = await request.json();

  // If deactivating, warn if ingredient is used in active recipes
  if (is_active === false) {
    const { data: recipes } = await supabase
      .from("recipes")
      .select("variant_id, product_variants!inner(is_active)")
      .eq("ingredient_id", params.id)
      .eq("product_variants.is_active", true);

    if (recipes && recipes.length > 0) {
      return NextResponse.json(
        { error: `Este insumo está siendo usado en ${recipes.length} receta(s) activa(s). Desactiva los productos correspondientes antes de continuar.` },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase
    .from("ingredients")
    .update({ is_active })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Soft delete
  const supabase = getSupabaseWithAuth(request);

  const { data: recipes } = await supabase
    .from("recipes")
    .select("variant_id, product_variants!inner(is_active)")
    .eq("ingredient_id", params.id)
    .eq("product_variants.is_active", true);

  if (recipes && recipes.length > 0) {
    return NextResponse.json(
      { error: `Este insumo está siendo usado en ${recipes.length} receta(s) activa(s). Desactiva los productos correspondientes antes de continuar.` },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("ingredients")
    .update({ is_active: false })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
