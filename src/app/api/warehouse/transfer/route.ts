import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, transferToBranch } from "@/lib/warehouse";

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { ingredient_id, quantity, branch_id, notes } = await request.json();
  if (!ingredient_id || quantity == null || !branch_id) {
    return NextResponse.json(
      { error: "ingredient_id, quantity y branch_id son requeridos" },
      { status: 400 }
    );
  }

  const { error, available } = await transferToBranch(
    supabase,
    ingredient_id,
    quantity,
    branch_id,
    notes ?? null,
    user.id
  );

  if (error) {
    return NextResponse.json({ error, available: available ?? null }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
