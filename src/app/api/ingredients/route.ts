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
  const showInactive = searchParams.get("showInactive") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const search = searchParams.get("search")?.trim() ?? "";

  let query = supabase
    .from("ingredients")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);
  if (!showInactive) query = query.eq("is_active", true);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count ?? 0, page, pageSize });
}
