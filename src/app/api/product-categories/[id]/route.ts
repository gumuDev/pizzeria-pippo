import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

async function getAdminSupabase(req: NextRequest) {
  const token = req.headers.get("Authorization")?.slice(7);
  if (!token) return null;
  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await userSupabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getAdminSupabase(req);
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { error } = await supabase
    .from("product_categories")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getAdminSupabase(req);
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: cat } = await supabase
    .from("product_categories")
    .select("name")
    .eq("id", params.id)
    .single();
  if (!cat) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category", cat.name);

  if (count && count > 0) {
    const { error } = await supabase
      .from("product_categories")
      .update({ is_active: false })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, soft: true, count });
  }

  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, soft: false });
}
