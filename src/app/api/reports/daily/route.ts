import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dateRangeFrom, dateRangeTo, toBoliviaDate } from "@/lib/timezone";

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
    .select("total, created_at, branch_id")
    .order("created_at");

  if (branchId) query = query.eq("branch_id", branchId);
  if (from) query = query.gte("created_at", dateRangeFrom(from));
  if (to) query = query.lte("created_at", dateRangeTo(to));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by local date (Bolivia UTC-4)
  const map: Record<string, number> = {};
  for (const order of data ?? []) {
    const localDate = toBoliviaDate(new Date(order.created_at));
    const date = localDate.toISOString().split("T")[0];
    map[date] = (map[date] ?? 0) + Number(order.total);
  }

  const result = Object.entries(map)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(result);
}
