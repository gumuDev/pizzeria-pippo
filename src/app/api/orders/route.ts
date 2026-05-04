import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deductStock } from "@/lib/recipes";
import { dateRangeFrom, dateRangeTo, todayInBolivia } from "@/lib/timezone";
import { apiHandler } from "@/lib/api-handler";
import { AuthError, ValidationError } from "@/lib/errors";

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

export const POST = apiHandler(async (request: NextRequest) => {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";

  // Verify auth with anon client
  const authClient = getAuthClient(token);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) throw new AuthError();

  const body = await request.json();
  const { branch_id, items, total, payment_method, order_type, idempotency_key } = body;

  if (!branch_id) throw new ValidationError("branch_id requerido");
  if (!items?.length) throw new ValidationError("items requeridos");
  if (!order_type || !["dine_in", "takeaway"].includes(order_type)) {
    throw new ValidationError("order_type requerido: 'dine_in' o 'takeaway'");
  }

  // Use service role for writes — avoids RLS issues with cashier role
  const supabase = getServiceClient();
  const cashier_id = user.id;

  // 0. Idempotency check — if this key was already used, return the existing order
  if (idempotency_key) {
    const { data: existing } = await supabase
      .from("orders")
      .select("id, daily_number")
      .eq("idempotency_key", idempotency_key)
      .single();
    if (existing) {
      return NextResponse.json({ order_id: existing.id, daily_number: existing.daily_number }, { status: 200 });
    }
  }

  // 1. Calculate daily order number for this branch
  const daily_number = await getNextDailyNumber(supabase, branch_id);

  // 2. Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ branch_id, cashier_id, total, daily_number, payment_method: payment_method ?? null, order_type, idempotency_key: idempotency_key ?? null })
    .select()
    .single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  // 3. Create order items
  type IncomingItem = {
    variant_id: string;
    qty: number;
    qty_physical: number;
    unit_price: number;
    discount_applied: number;
    promo_label?: string | null;
    flavors?: { variant_id: string; product_name: string; proportion: number }[] | null;
  };

  const { data: insertedItems, error: itemsError } = await supabase
    .from("order_items")
    .insert(
      items.map((i: IncomingItem) => ({
        order_id: order.id,
        variant_id: i.variant_id,
        qty: i.qty,
        qty_physical: i.qty_physical ?? i.qty,
        unit_price: i.unit_price,
        discount_applied: i.discount_applied,
        promo_label: i.promo_label ?? null,
      }))
    )
    .select("id, variant_id");

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  // 3b. Insert order_item_flavors for mixed pizzas
  const flavorRows = (insertedItems ?? []).flatMap((dbItem: { id: string; variant_id: string }) => {
    const source = (items as IncomingItem[]).find((i) => i.variant_id === dbItem.variant_id);
    if (!source?.flavors?.length) return [];
    return source.flavors.map((f) => ({
      order_item_id: dbItem.id,
      variant_id: f.variant_id,
      proportion: f.proportion,
    }));
  });

  if (flavorRows.length > 0) {
    const { error: flavorsError } = await supabase.from("order_item_flavors").insert(flavorRows);
    if (flavorsError) return NextResponse.json({ error: flavorsError.message }, { status: 500 });
  }

  // 4. Deduct stock based on recipes
  const { success, error: stockError } = await deductStock(order.id, branch_id, token, cashier_id, order_type);
  if (!success) return NextResponse.json({ error: stockError }, { status: 500 });

  return NextResponse.json({ order_id: order.id, daily_number: order.daily_number }, { status: 201 });
});
