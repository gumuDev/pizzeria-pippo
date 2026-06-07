import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/warehouse";

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { variant_id, real_quantity, notes } = await request.json();
  if (!variant_id || real_quantity == null) {
    return NextResponse.json({ error: "variant_id y real_quantity son requeridos" }, { status: 400 });
  }
  if (real_quantity < 0) return NextResponse.json({ error: "La cantidad no puede ser negativa" }, { status: 400 });

  const { data: warehouseRow } = await supabase
    .from("warehouse_product_stock")
    .select("id, quantity")
    .eq("variant_id", variant_id)
    .maybeSingle();

  if (!warehouseRow) return NextResponse.json({ error: "Producto no encontrado en bodega" }, { status: 404 });

  const diff = real_quantity - warehouseRow.quantity;

  const { error: updateErr } = await supabase
    .from("warehouse_product_stock")
    .update({ quantity: real_quantity, updated_at: new Date().toISOString() })
    .eq("id", warehouseRow.id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const { error: movErr } = await supabase.from("warehouse_product_movements").insert({
    variant_id,
    quantity: diff,
    type: "ajuste",
    branch_id: null,
    notes: notes ?? null,
    created_by: user.id,
  });
  if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
