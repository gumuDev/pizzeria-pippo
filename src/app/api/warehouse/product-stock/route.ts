import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/warehouse";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data, error } = await supabase
    .from("warehouse_product_stock")
    .select(`
      id, quantity, min_quantity, variant_id,
      product_variants ( id, name, products ( id, name, is_active ) )
    `)
    .order("variant_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered = (data ?? []).filter((row) => {
    const product = (row.product_variants as unknown as { products: { is_active: boolean } | null } | null)?.products;
    return product?.is_active;
  });

  return NextResponse.json({ data: filtered, total: filtered.length });
}
