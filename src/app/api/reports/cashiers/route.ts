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
  const cashierId = searchParams.get("cashierId");

  // Fetch orders and profiles separately — no direct FK between orders.cashier_id and profiles
  let ordersQuery = supabase
    .from("orders")
    .select(`
      id, total, created_at, cashier_id, branch_id,
      order_items (
        qty, unit_price, discount_applied,
        product_variants (
          id, name,
          products ( id, name, category )
        )
      )
    `);

  if (branchId) ordersQuery = ordersQuery.eq("branch_id", branchId);
  if (cashierId) ordersQuery = ordersQuery.eq("cashier_id", cashierId);
  if (from) ordersQuery = ordersQuery.gte("created_at", dateRangeFrom(from));
  if (to) ordersQuery = ordersQuery.lte("created_at", dateRangeTo(to));
  ordersQuery = ordersQuery.order("created_at", { ascending: false });

  const { data, error } = await ordersQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch profiles for all cashier IDs found in orders
  const cashierIds = [...new Set((data ?? []).map((o) => o.cashier_id).filter(Boolean))];
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

  // Aggregate by cashier
  const cashierMap: Record<string, {
    cashier_id: string;
    cashier_name: string;
    orders: number;
    total: number;
    items: {
      variant_id: string;
      product_name: string;
      variant_name: string;
      category: string;
      qty: number;
      revenue: number;
    }[];
  }> = {};

  for (const order of data ?? []) {
    const cid = order.cashier_id;
    const cname = profileMap[cid] ?? "Desconocido";

    if (!cashierMap[cid]) {
      cashierMap[cid] = { cashier_id: cid, cashier_name: cname, orders: 0, total: 0, items: [] };
    }

    cashierMap[cid].orders += 1;
    cashierMap[cid].total += Number(order.total);

    for (const item of (order.order_items as any[]) ?? []) {
      const variant = item.product_variants;
      if (!variant) continue;
      const existing = cashierMap[cid].items.find((i) => i.variant_id === variant.id);
      const revenue = (Number(item.unit_price) * item.qty) - Number(item.discount_applied);
      if (existing) {
        existing.qty += item.qty;
        existing.revenue += revenue;
      } else {
        cashierMap[cid].items.push({
          variant_id: variant.id,
          product_name: variant.products?.name ?? "",
          variant_name: variant.name,
          category: variant.products?.category ?? "",
          qty: item.qty,
          revenue,
        });
      }
    }
  }

  const result = Object.values(cashierMap).sort((a, b) => b.total - a.total);
  return NextResponse.json(result);
}
