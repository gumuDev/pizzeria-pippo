import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/warehouse";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { searchParams } = new URL(request.url);
  const variantId = searchParams.get("variantId");
  const branchId = searchParams.get("branchId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("warehouse_product_movements")
    .select(`
      id, quantity, type, notes, created_at, variant_id, branch_id,
      product_variants ( id, name, products ( id, name ) ),
      branches ( id, name )
    `)
    .order("created_at", { ascending: false });

  if (variantId) query = query.eq("variant_id", variantId);
  if (branchId) query = query.eq("branch_id", branchId);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
