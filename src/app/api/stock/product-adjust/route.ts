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

export async function POST(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  const { branch_id, variant_id, real_quantity, notes } = await request.json();

  if (!branch_id || !variant_id || real_quantity === undefined) {
    return NextResponse.json({ error: "branch_id, variant_id y real_quantity son requeridos" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("branch_product_stock")
    .select("id, quantity")
    .eq("branch_id", branch_id)
    .eq("variant_id", variant_id)
    .single();

  if (fetchError) return NextResponse.json({ error: "Producto no encontrado en esta sucursal" }, { status: 404 });

  const difference = real_quantity - (existing?.quantity ?? 0);

  const { error: updateError } = await supabase
    .from("branch_product_stock")
    .update({ quantity: real_quantity, updated_at: new Date().toISOString() })
    .eq("id", existing.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { data: session } = await supabase.auth.getUser();
  const { error: movErr } = await supabase.from("product_stock_movements").insert({
    branch_id, variant_id, quantity: difference, type: "ajuste",
    notes: notes ?? null, created_by: session?.user?.id ?? null,
  });
  if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 });

  return NextResponse.json({ success: true, difference });
}
