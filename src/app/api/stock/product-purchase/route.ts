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
  const { branch_id, variant_id, quantity, min_quantity } = await request.json();

  if (!branch_id || !variant_id || !quantity) {
    return NextResponse.json({ error: "branch_id, variant_id y quantity son requeridos" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("branch_product_stock")
    .select("id, quantity")
    .eq("branch_id", branch_id)
    .eq("variant_id", variant_id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("branch_product_stock")
      .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("branch_product_stock")
      .insert({ branch_id, variant_id, quantity, min_quantity: min_quantity ?? 0 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: session } = await supabase.auth.getUser();
  const { error: movErr } = await supabase.from("product_stock_movements").insert({
    branch_id,
    variant_id,
    quantity,
    type: "compra",
    created_by: session?.user?.id ?? null,
  });
  if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
