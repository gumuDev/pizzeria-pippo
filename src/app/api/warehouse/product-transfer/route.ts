import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/warehouse";
import { apiHandler } from "@/lib/api-handler";

export const POST = apiHandler(async (request: NextRequest) => {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { variant_id, quantity, branch_id, notes } = await request.json();
  if (!variant_id || quantity == null || !branch_id) {
    return NextResponse.json({ error: "variant_id, quantity y branch_id son requeridos" }, { status: 400 });
  }
  if (quantity <= 0) return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 });

  // Check warehouse stock
  const { data: warehouseRow } = await supabase
    .from("warehouse_product_stock")
    .select("id, quantity")
    .eq("variant_id", variant_id)
    .maybeSingle();

  if (!warehouseRow) return NextResponse.json({ error: "Producto no encontrado en bodega" }, { status: 404 });
  if (warehouseRow.quantity < quantity) {
    return NextResponse.json(
      { error: `Stock insuficiente en bodega. Disponible: ${warehouseRow.quantity}`, available: warehouseRow.quantity },
      { status: 400 }
    );
  }

  // Deduct from warehouse
  const { error: warehouseErr } = await supabase
    .from("warehouse_product_stock")
    .update({ quantity: warehouseRow.quantity - quantity, updated_at: new Date().toISOString() })
    .eq("id", warehouseRow.id);
  if (warehouseErr) return NextResponse.json({ error: warehouseErr.message }, { status: 500 });

  // Add to branch_product_stock
  const { data: branchRow } = await supabase
    .from("branch_product_stock")
    .select("id, quantity")
    .eq("branch_id", branch_id)
    .eq("variant_id", variant_id)
    .maybeSingle();

  if (branchRow) {
    const { error } = await supabase
      .from("branch_product_stock")
      .update({ quantity: branchRow.quantity + quantity, updated_at: new Date().toISOString() })
      .eq("id", branchRow.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("branch_product_stock")
      .insert({ branch_id, variant_id, quantity, min_quantity: 0 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Record in warehouse_product_movements
  const { error: wmErr } = await supabase.from("warehouse_product_movements").insert({
    variant_id, quantity: -quantity, type: "transferencia",
    branch_id, notes: notes ?? null, created_by: user.id,
  });
  if (wmErr) return NextResponse.json({ error: wmErr.message }, { status: 500 });

  // Record in product_stock_movements (branch side)
  const { error: smErr } = await supabase.from("product_stock_movements").insert({
    branch_id, variant_id, quantity, type: "compra",
    notes: notes ?? null, created_by: user.id,
  });
  if (smErr) return NextResponse.json({ error: smErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
});
