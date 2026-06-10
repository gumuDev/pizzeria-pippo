import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const { client: supabase } = await createAuthClient(request);
  const branchId = new URL(request.url).searchParams.get("branchId");

  let query = supabase
    .from("branch_stock")
    .select("*, ingredients(id, name, unit), branches(id, name)");

  if (branchId) query = query.eq("branch_id", branchId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter rows where quantity is below minimum threshold
  const alerts = (data ?? []).filter((s) => s.quantity < s.min_quantity);
  return NextResponse.json(alerts);
});
