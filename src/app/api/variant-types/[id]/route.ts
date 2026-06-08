import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServiceClient } from "@/lib/supabase-server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { client: supabase } = await createAuthClient(request);
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
  const { client: supabase } = await createAuthClient(request);
  const { is_active } = await request.json();

  // If deactivating, check that no active product_variants use this type
  if (is_active === false) {
    const serviceClient = createServiceClient();
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
