import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, getWarehouseStock } from "@/lib/warehouse";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const supabase = createAuthClient(token);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10));
  const ingredientId = searchParams.get("ingredientId") ?? undefined;
  const rawStatus = searchParams.get("status");
  const status = rawStatus === "low" || rawStatus === "ok" ? rawStatus : undefined;

  const { data, total, error } = await getWarehouseStock(supabase, page, pageSize, { ingredientId, status });
  if (error) return NextResponse.json({ error }, { status: 500 });

  // Check which ingredients have warehouse movements
  const ingredientIds = (data ?? []).map((r) => r.ingredient_id);
  const { data: movements } = await supabase
    .from("warehouse_movements")
    .select("ingredient_id")
    .in("ingredient_id", ingredientIds.length ? ingredientIds : ["none"]);

  const withMovements = new Set((movements ?? []).map((m: { ingredient_id: string }) => m.ingredient_id));

  const enriched = (data ?? []).map((r) => ({ ...r, has_movements: withMovements.has(r.ingredient_id) }));

  return NextResponse.json({ data: enriched, total, page, pageSize });
}
