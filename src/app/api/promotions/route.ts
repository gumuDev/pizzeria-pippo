import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getActivePromotions } from "@/lib/promotions";

function getSupabaseWithAuth(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const dateParam = searchParams.get("date");

  const showInactive = new URL(request.url).searchParams.get("showInactive") === "true";

  let query = supabase
    .from("promotions")
    .select("*, promotion_rules(*)")
    .order("name");

  if (!showInactive) query = query.eq("is_active", true);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If branchId + date provided, filter to active promotions for POS
  if (branchId && dateParam) {
    // Parse as local date (not UTC) to avoid timezone offset shifting the day
    const [year, month, day] = dateParam.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const active = getActivePromotions(data ?? [], branchId, date);
    return NextResponse.json(active);
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  const body = await request.json();
  const { name, type, days_of_week, start_date, end_date, branch_id, rules } = body;

  const { data: promo, error: promoError } = await supabase
    .from("promotions")
    .insert({ name, type, days_of_week, start_date, end_date, branch_id: branch_id || null, active: true })
    .select()
    .single();

  if (promoError) return NextResponse.json({ error: promoError.message }, { status: 500 });

  if (rules?.length) {
    const { error: rulesError } = await supabase
      .from("promotion_rules")
      .insert(rules.map(({ id: _id, ...r }: Record<string, unknown>) => ({ ...r, promotion_id: promo.id })))
    if (rulesError) return NextResponse.json({ error: rulesError.message }, { status: 500 });
  }

  return NextResponse.json(promo, { status: 201 });
}
