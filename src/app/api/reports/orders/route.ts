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
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

  let query = supabase
    .from("orders")
    .select(`
      id, daily_number, total, created_at, branch_id, cashier_id, payment_method, order_type, cancelled_at, cancel_reason,
      branches:branch_id ( name ),
      order_items (
        qty, unit_price, discount_applied, promo_label,
        product_variants (
          name,
          products ( name, category )
        )
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (branchId) query = query.eq("branch_id", branchId);
  if (from) query = query.gte("created_at", dateRangeFrom(from));
  if (to) query = query.lte("created_at", dateRangeTo(to));

  const from_row = (page - 1) * pageSize;
  const to_row = from_row + pageSize - 1;
  query = query.range(from_row, to_row);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch profiles separately — no direct FK between orders.cashier_id and profiles
  const cashierIds = Array.from(new Set((data ?? []).map((o) => o.cashier_id).filter(Boolean)));
  const profileMap: Record<string, string> = {};
  if (cashierIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", cashierIds);
    for (const p of profiles ?? []) {
      profileMap[p.id] = p.full_name ?? "Sin nombre";
    }
  }

  const result = (data ?? []).map((o) => ({
    ...o,
    cashier_name: profileMap[o.cashier_id] ?? "—",
  }));

  return NextResponse.json({ data: result, total: count ?? 0 });
}
