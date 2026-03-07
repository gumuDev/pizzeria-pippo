import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, getWarehouseMovements } from "@/lib/warehouse";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filters = {
    type: (searchParams.get("type") as "compra" | "transferencia" | "ajuste") || undefined,
    ingredient_id: searchParams.get("ingredientId") || undefined,
    branch_id: searchParams.get("branchId") || undefined,
    date_from: searchParams.get("from") || undefined,
    date_to: searchParams.get("to") || undefined,
  };

  const { data, error } = await getWarehouseMovements(supabase, filters);
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json(data);
}
