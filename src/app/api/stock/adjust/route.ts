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

export async function POST(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  const { branch_id, ingredient_id, real_quantity, notes } = await request.json();

  // Get current quantity to calculate difference
  const { data: existing, error: fetchError } = await supabase
    .from("branch_stock")
    .select("id, quantity")
    .eq("branch_id", branch_id)
    .eq("ingredient_id", ingredient_id)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const difference = real_quantity - (existing?.quantity ?? 0);

  // Update stock to real quantity
  if (existing) {
    const { error } = await supabase
      .from("branch_stock")
      .update({ quantity: real_quantity })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("branch_stock")
      .insert({ branch_id, ingredient_id, quantity: real_quantity, min_quantity: 0 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Record movement with the difference (can be negative)
  const { data: session } = await supabase.auth.getUser();
  const { error: movErr } = await supabase.from("stock_movements").insert({
    branch_id,
    ingredient_id,
    quantity: difference,
    type: "ajuste",
    notes: notes ?? null,
    created_by: session?.user?.id ?? null,
  });
  if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 });

  return NextResponse.json({ success: true, difference });
}
