import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { reverseStock } from "@/lib/recipes";
import { todayInBolivia } from "@/lib/timezone";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  // Verify token and get user identity
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const reason: string = body?.reason?.trim() ?? "";

  if (!reason) {
    return NextResponse.json({ error: "El motivo de anulación es requerido" }, { status: 400 });
  }

  // Fetch the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, branch_id, cancelled_at, created_at, order_type")
    .eq("id", params.id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.cancelled_at !== null) {
    return NextResponse.json({ error: "La orden ya fue anulada" }, { status: 409 });
  }

  // Cajero restrictions: only own branch and only today's orders
  if (profile.role === "cajero") {
    if (profile.branch_id !== order.branch_id) {
      return NextResponse.json({ error: "No tenés permiso para anular esta orden" }, { status: 403 });
    }
    const today = todayInBolivia();
    const orderDate = order.created_at.split("T")[0];
    if (orderDate !== today) {
      return NextResponse.json({ error: "Solo podés anular órdenes del día actual" }, { status: 403 });
    }
  }

  // Reverse stock
  const reverseResult = await reverseStock(
    order.id,
    order.branch_id,
    user.id,
    reason,
    order.order_type ?? "dine_in"
  );

  if (!reverseResult.success) {
    return NextResponse.json({ error: `Error al restaurar stock: ${reverseResult.error}` }, { status: 500 });
  }

  // Mark order as cancelled
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancel_reason: reason,
    })
    .eq("id", order.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
