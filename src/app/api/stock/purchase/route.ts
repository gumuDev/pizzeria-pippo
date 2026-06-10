import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { apiHandler } from "@/lib/api-handler";

export const POST = apiHandler(async (request: NextRequest) => {
  const { client: supabase, userId } = await createAuthClient(request);
  const { branch_id, ingredient_id, quantity, min_quantity } = await request.json();

  // Upsert branch_stock: add quantity to existing stock
  const { data: existing } = await supabase
    .from("branch_stock")
    .select("id, quantity")
    .eq("branch_id", branch_id)
    .eq("ingredient_id", ingredient_id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("branch_stock")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("branch_stock")
      .insert({ branch_id, ingredient_id, quantity, min_quantity: min_quantity ?? 0 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Record movement
  const { error: movErr } = await supabase.from("stock_movements").insert({
    branch_id,
    ingredient_id,
    quantity,
    type: "compra",
    created_by: userId,
  });
  if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
});
