import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deductStock } from "@/lib/recipes";
import { dateRangeFrom, dateRangeTo, todayInBolivia } from "@/lib/timezone";

function getAuthClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getNextDailyNumber(supabase: any, branchId: string): Promise<number> {
  const today = todayInBolivia();
  const { data } = await supabase
    .from("orders")
    .select("daily_number")
    .eq("branch_id", branchId)
    .gte("created_at", dateRangeFrom(today))
    .lte("created_at", dateRangeTo(today))
    .order("daily_number", { ascending: false })
    .limit(1)
    .single() as { data: { daily_number: number } | null };

  return (data?.daily_number ?? 0) + 1;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";

  // Verify auth with anon client
  const authClient = getAuthClient(token);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const { branch_id, items, total, payment_method } = body;

  if (!branch_id) return NextResponse.json({ error: "branch_id requerido" }, { status: 400 });
  if (!items?.length) return NextResponse.json({ error: "items requeridos" }, { status: 400 });

  // Use service role for writes — avoids RLS issues with cashier role
  const supabase = getServiceClient();
  const cashier_id = user.id;

  // 1. Calculate daily order number for this branch
  const daily_number = await getNextDailyNumber(supabase, branch_id);

  // 2. Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ branch_id, cashier_id, total, daily_number, payment_method: payment_method ?? null })
    .select()
    .single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  // 3. Create order items
  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((i: { variant_id: string; qty: number; qty_physical: number; unit_price: number; discount_applied: number; promo_label?: string | null }) => ({
      order_id: order.id,
      variant_id: i.variant_id,
      qty: i.qty,
      qty_physical: i.qty_physical ?? i.qty,
      unit_price: i.unit_price,
      discount_applied: i.discount_applied,
      promo_label: i.promo_label ?? null,
    }))
  );

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  // 4. Deduct stock based on recipes
  const { success, error: stockError } = await deductStock(order.id, branch_id, token, cashier_id);
  if (!success) return NextResponse.json({ error: stockError }, { status: 500 });

  return NextResponse.json({ order_id: order.id, daily_number: order.daily_number }, { status: 201 });
}
