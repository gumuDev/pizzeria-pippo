import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase-server";
import { apiHandler } from "@/lib/api-handler";

// GET /api/products/[id]/branch-prices
export const GET = apiHandler(async (request: NextRequest, ctx?: { params: Record<string, string> }) => {
  const params = { id: ctx?.params?.id ?? "" };
  const { client: supabase } = await createAuthClient(request);
  const { id } = params;

  const [variantsRes, branchesRes] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, name, base_price, branch_prices ( id, branch_id, price, branches ( id, name ) )")
      .eq("product_id", id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("branches")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (variantsRes.error) return NextResponse.json({ error: variantsRes.error.message }, { status: 500 });
  if (branchesRes.error) return NextResponse.json({ error: branchesRes.error.message }, { status: 500 });

  return NextResponse.json({ variants: variantsRes.data ?? [], branches: branchesRes.data ?? [] });
});

// POST /api/products/[id]/branch-prices
export const POST = apiHandler(async (request: NextRequest) => {
  const { client: supabase } = await createAuthClient(request);
  const { variant_id, branch_id, price } = await request.json();

  if (!variant_id || !branch_id || price === undefined) {
    return NextResponse.json({ error: "variant_id, branch_id y price son requeridos" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("branch_prices")
    .select("id")
    .eq("variant_id", variant_id)
    .eq("branch_id", branch_id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("branch_prices")
      .update({ price })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("branch_prices")
      .insert({ variant_id, branch_id, price });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
