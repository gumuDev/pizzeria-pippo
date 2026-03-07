import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, adjustWarehouseStock } from "@/lib/warehouse";

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { ingredient_id, real_quantity, notes } = await request.json();
  if (!ingredient_id || real_quantity == null) {
    return NextResponse.json(
      { error: "ingredient_id y real_quantity son requeridos" },
      { status: 400 }
    );
  }

  const { error, difference } = await adjustWarehouseStock(
    supabase,
    ingredient_id,
    real_quantity,
    notes ?? null,
    user.id
  );

  if (error) return NextResponse.json({ error }, { status: 400 });

  return NextResponse.json({ success: true, difference });
}
