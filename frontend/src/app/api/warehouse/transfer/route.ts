import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, transferToBranch } from "@/lib/warehouse";
import { apiHandler } from "@/lib/api-handler";
import { AuthError, ValidationError } from "@/lib/errors";

export const POST = apiHandler(async (request: NextRequest) => {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { ingredient_id, quantity, branch_id, notes } = await request.json();
  if (!ingredient_id || quantity == null || !branch_id) {
    throw new ValidationError("ingredient_id, quantity y branch_id son requeridos");
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
});
