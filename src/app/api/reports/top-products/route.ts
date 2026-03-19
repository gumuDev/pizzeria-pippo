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

  // Get order_items joined with orders (for branch filter) and variants+products
  const query = supabase
    .from("order_items")
    .select(`
      qty, unit_price, discount_applied,
      product_variants (
        id, name,
        products ( id, name, category )
      ),
      orders ( branch_id, created_at, cancelled_at )
    `);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter by branch and date range client-side (Supabase doesn't support nested filters easily)
  // Use Bolivia UTC-4 offset for date comparisons
  const filtered = (data ?? []).filter((item) => {
    const order = item.orders as unknown as { branch_id: string; created_at: string; cancelled_at: string | null } | null;
    if (!order) return false;
    if (order.cancelled_at) return false;
    if (branchId && order.branch_id !== branchId) return false;
    if (from && order.created_at < dateRangeFrom(from)) return false;
    if (to && order.created_at > dateRangeTo(to)) return false;
    return true;
  });

  // Aggregate by variant
  const map: Record<string, {
    variant_id: string;
    product_name: string;
    variant_name: string;
    category: string;
    qty: number;
    revenue: number;
  }> = {};

  for (const item of filtered) {
    const variant = item.product_variants as unknown as { id: string; name: string; products: { id: string; name: string; category: string } | null } | null;
    if (!variant) continue;
    const key = variant.id;
    if (!map[key]) {
      map[key] = {
        variant_id: variant.id,
        product_name: variant.products?.name ?? "",
        variant_name: variant.name,
        category: variant.products?.category ?? "",
        qty: 0,
        revenue: 0,
      };
    }
    map[key].qty += item.qty;
    map[key].revenue += (Number(item.unit_price) * item.qty) - Number(item.discount_applied);
  }

  const result = Object.values(map).sort((a, b) => b.qty - a.qty);
  return NextResponse.json(result);
}
