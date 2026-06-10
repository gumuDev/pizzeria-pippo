import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const { client: supabase } = await createAuthClient(request);
  const onlyActive = new URL(request.url).searchParams.get("onlyActive") !== "false";

  let query = supabase
    .from("variant_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (onlyActive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const POST = apiHandler(async (request: NextRequest) => {
  const { client: supabase } = await createAuthClient(request);
  const { name, sort_order } = await request.json();

  if (!name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const { data, error } = await supabase
    .from("variant_types")
    .insert({ name: name.trim(), sort_order: sort_order ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});
