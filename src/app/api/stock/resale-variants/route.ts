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

  const { data, error } = await supabase
    .from("product_variants")
    .select(`id, name, products!inner ( id, name, is_active, product_type )`)
    .eq("products.is_active", true)
    .eq("products.product_type", "resale")
    .eq("is_active", true)
    .order("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
