import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, getWarehouseStock } from "@/lib/warehouse";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await getWarehouseStock(supabase);
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json(data);
}
