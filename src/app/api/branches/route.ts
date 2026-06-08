import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { client: supabase } = await createAuthClient(request);
  const showInactive = new URL(request.url).searchParams.get("showInactive") === "true";

  let query = supabase.from("branches").select("*").order("created_at", { ascending: true });
  if (!showInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { client: supabase } = await createAuthClient(request);
  const body = await request.json();
  const { name, address } = body;

  const { data, error } = await supabase
    .from("branches")
    .insert({ name, address })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
