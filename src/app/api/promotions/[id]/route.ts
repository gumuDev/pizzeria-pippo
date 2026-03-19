import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseWithAuth(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseWithAuth(request);
  const body = await request.json();
  const { name, type, days_of_week, start_date, end_date, branch_id, active, rules } = body;

  const { error: promoError } = await supabase
    .from("promotions")
    .update({ name, type, days_of_week, start_date, end_date, branch_id: branch_id || null, active })
    .eq("id", params.id);

  if (promoError) return NextResponse.json({ error: promoError.message }, { status: 500 });

  // Replace rules: delete existing then re-insert
  await supabase.from("promotion_rules").delete().eq("promotion_id", params.id);

  if (rules?.length) {
    const { error: rulesError } = await supabase
      .from("promotion_rules")
      .insert(rules.map(({ id: _id, ...r }: Record<string, unknown>) => ({ ...r, promotion_id: params.id })));
    if (rulesError) return NextResponse.json({ error: rulesError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseWithAuth(request);
  const body = await request.json();
  // Accepts is_active (soft delete toggle) or active (POS active toggle) — never a full update
  const update: Record<string, unknown> = {};
  if (body.is_active !== undefined) update.is_active = body.is_active;
  if (body.active !== undefined) update.active = body.active;
  const { error } = await supabase.from("promotions").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Soft delete
  const supabase = getSupabaseWithAuth(request);
  const { error } = await supabase.from("promotions").update({ is_active: false }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
