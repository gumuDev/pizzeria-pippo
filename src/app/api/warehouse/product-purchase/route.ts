import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/warehouse";

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { variant_id, quantity, min_quantity, notes } = await request.json();
  if (!variant_id || quantity == null) {
    return NextResponse.json({ error: "variant_id y quantity son requeridos" }, { status: 400 });
  }
  if (quantity <= 0) return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 });

  const { data: existing } = await supabase
    .from("warehouse_product_stock")
    .select("id, quantity")
    .eq("variant_id", variant_id)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, unknown> = { quantity: existing.quantity + quantity, updated_at: new Date().toISOString() };
    if (min_quantity != null) updates.min_quantity = min_quantity;
    const { error } = await supabase.from("warehouse_product_stock").update(updates).eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("warehouse_product_stock")
      .insert({ variant_id, quantity, min_quantity: min_quantity ?? 0 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: movErr } = await supabase.from("warehouse_product_movements").insert({
    variant_id, quantity, type: "compra", branch_id: null,
    notes: notes ?? null, created_by: user.id,
  });
  if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
