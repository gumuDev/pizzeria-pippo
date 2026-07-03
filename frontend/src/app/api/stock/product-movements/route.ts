import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const { client: supabase } = await createAuthClient(request);
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("product_stock_movements")
    .select(`
      id, quantity, type, notes, created_at,
      product_variants ( id, name, products ( id, name ) )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (branchId) query = query.eq("branch_id", branchId);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count ?? 0, page, pageSize });
});
