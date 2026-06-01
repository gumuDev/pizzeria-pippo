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

// Returns all active resale product variants (track_stock=true, no recipe) — global, no branch filter
export async function GET(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);

  const { data, error } = await supabase
    .from("product_variants")
    .select(`
      id, name,
      products ( id, name, is_active, track_stock ),
      recipes ( variant_id )
    `)
    .order("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const resale = (data ?? []).filter((v) => {
    const p = (v.products as unknown as { is_active: boolean; track_stock: boolean } | null);
    const hasRecipe = Array.isArray(v.recipes) && v.recipes.length > 0;
    return p?.is_active && p?.track_stock && !hasRecipe;
  });

  return NextResponse.json({ data: resale });
}
