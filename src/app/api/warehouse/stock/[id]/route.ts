import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/warehouse";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = params;

  // Check if it has movements
  const { data: row } = await supabase
    .from("warehouse_stock")
    .select("ingredient_id")
    .eq("id", id)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Insumo no encontrado" }, { status: 404 });

  const { count } = await supabase
    .from("warehouse_movements")
    .select("id", { count: "exact", head: true })
    .eq("ingredient_id", row.ingredient_id);

  if (count && count > 0) {
    return NextResponse.json({ error: "No se puede eliminar: tiene movimientos registrados" }, { status: 409 });
  }

  const { error } = await supabase.from("warehouse_stock").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
