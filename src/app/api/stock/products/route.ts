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

// Returns branch_product_stock rows for resale products (track_stock=true, no recipes)
export async function GET(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");

  if (!branchId) {
    return NextResponse.json({ error: "branchId requerido" }, { status: 400 });
  }


  const { data, error } = await supabase
    .from("branch_product_stock")
    .select(`
      id, quantity, min_quantity,
      variant_id,
      product_variants (
        id, name, base_price,
        products ( id, name, is_active, track_stock )
      )
    `)
    .eq("branch_id", branchId)
    .order("variant_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Only include active products with track_stock = true
  const filtered = (data ?? []).filter((row) => {
    const product = (row.product_variants as unknown as { products: { is_active: boolean; track_stock: boolean } | null } | null)?.products;
    return product?.is_active && product?.track_stock;
  });

  return NextResponse.json({ data: filtered, total: filtered.length });
}
