import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseWithAuth(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");
  const ingredientId = searchParams.get("ingredientId");
  const type = searchParams.get("type");

  let query = supabase
    .from("stock_movements")
    .select("*, ingredients(id, name, unit), branches(id, name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (branchId) query = query.eq("branch_id", branchId);
  if (ingredientId) query = query.eq("ingredient_id", ingredientId);
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
