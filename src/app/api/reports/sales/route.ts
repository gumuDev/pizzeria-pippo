import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dateRangeFrom, dateRangeTo } from "@/lib/timezone";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("orders")
    .select("id, total, created_at, branch_id, order_type");

  if (branchId) query = query.eq("branch_id", branchId);
  if (from) query = query.gte("created_at", dateRangeFrom(from));
  if (to) query = query.lte("created_at", dateRangeTo(to));

  const { data: orders, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = orders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
  const count = orders?.length ?? 0;
  const avg = count > 0 ? total / count : 0;

  const dineIn = orders?.filter((o) => o.order_type === "dine_in") ?? [];
  const takeaway = orders?.filter((o) => o.order_type === "takeaway") ?? [];

  return NextResponse.json({
    total,
    count,
    avg,
    by_order_type: {
      dine_in: {
        total: dineIn.reduce((sum, o) => sum + Number(o.total), 0),
        count: dineIn.length,
      },
      takeaway: {
        total: takeaway.reduce((sum, o) => sum + Number(o.total), 0),
        count: takeaway.length,
      },
    },
  });
}
