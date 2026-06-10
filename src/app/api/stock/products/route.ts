import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const { client: supabase } = await createAuthClient(request);
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");

  if (!branchId) return NextResponse.json({ error: "branchId requerido" }, { status: 400 });

  const { data, error } = await supabase
    .from("branch_product_stock")
    .select(`
      id, quantity, min_quantity, variant_id,
      product_variants ( id, name, base_price, products ( id, name, is_active ) )
    `)
    .eq("branch_id", branchId)
    .order("variant_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered = (data ?? []).filter((row) => {
    const product = (row.product_variants as unknown as { products: { is_active: boolean } | null } | null)?.products;
    return product?.is_active;
  });

  return NextResponse.json({ data: filtered, total: filtered.length });
});
