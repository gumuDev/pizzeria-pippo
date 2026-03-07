import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, registerPurchase } from "@/lib/warehouse";

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { ingredient_id, quantity, notes, min_quantity } = await request.json();
  if (!ingredient_id || quantity == null) {
    return NextResponse.json({ error: "ingredient_id y quantity son requeridos" }, { status: 400 });
  }

  const { error } = await registerPurchase(
    supabase, ingredient_id, quantity, notes ?? null, user.id,
    min_quantity != null ? Number(min_quantity) : undefined
  );
  if (error) {
    console.error("[warehouse/purchase]", error);
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
