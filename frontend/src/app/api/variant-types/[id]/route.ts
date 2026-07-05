import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServiceClient } from "@/lib/supabase-server";
import { apiHandler } from "@/lib/api-handler";

export const PUT = apiHandler(async (request: NextRequest, ctx?: { params: Record<string, string> }) => {
  const params = { id: ctx?.params?.id ?? "" };
  const { client: supabase } = await createAuthClient(request);
  const { name } = await request.json();

  if (!name?.trim()) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const { data, error } = await supabase
    .from("variant_types")
    .update({ name: name.trim() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const PATCH = apiHandler(async (request: NextRequest, ctx?: { params: Record<string, string> }) => {
  const params = { id: ctx?.params?.id ?? "" };
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
});
