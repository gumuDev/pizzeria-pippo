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

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseWithAuth(request);
  const { name, sort_order } = await request.json();

  if (!name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const { data, error } = await supabase
    .from("variant_types")
    .update({ name: name.trim(), sort_order: sort_order ?? 0 })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseWithAuth(request);
  const { is_active } = await request.json();

  // If deactivating, check that no active product_variants use this type
  if (is_active === false) {
    const serviceClient = getServiceClient();
    const { data: variantType } = await serviceClient
      .from("variant_types")
      .select("name")
      .eq("id", params.id)
      .single();

    if (variantType) {
      const { count } = await serviceClient
        .from("product_variants")
        .select("id", { count: "exact", head: true })
        .eq("name", variantType.name)
        .eq("is_active", true);

      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { error: `Hay ${count} producto(s) usando este tipo. Desactivá las variantes primero.` },
          { status: 409 }
        );
      }
    }
  }

  const { data, error } = await supabase
    .from("variant_types")
    .update({ is_active })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
