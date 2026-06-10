import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (request: NextRequest) => {
  const { client: supabase } = await createAuthClient(request);

  const { data, error } = await supabase
    .from("product_variants")
    .select(`id, name, products!inner ( id, name, is_active, product_type )`)
    .eq("products.is_active", true)
    .eq("products.product_type", "resale")
    .eq("is_active", true)
    .order("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
});
