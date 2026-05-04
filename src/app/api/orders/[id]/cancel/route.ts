import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { reverseStock } from "@/lib/recipes";
import { todayInBolivia } from "@/lib/timezone";
import { apiHandler } from "@/lib/api-handler";
import { AuthError, ForbiddenError, NotFoundError, ConflictError, ValidationError } from "@/lib/errors";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const POST = apiHandler(async (
  request: NextRequest,
  ctx?: { params: Record<string, string> }
) => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new AuthError();
  const token = authHeader.slice(7);

  // Verify token and get user identity
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) throw new AuthError();

  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new ForbiddenError("Perfil no encontrado");

  const body = await request.json().catch(() => ({}));
  const reason: string = body?.reason?.trim() ?? "";

  if (!reason) throw new ValidationError("El motivo de anulación es requerido");

  const orderId = ctx?.params?.id;

  // Fetch the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, branch_id, cancelled_at, created_at, order_type")
    .eq("id", orderId)
    .single();

  if (orderError || !order) throw new NotFoundError("Orden no encontrada");

  if (order.cancelled_at !== null) throw new ConflictError("La orden ya fue anulada");

  // Cajero restrictions: only own branch and only today's orders
  if (profile.role === "cajero") {
    if (profile.branch_id !== order.branch_id) {
      throw new ForbiddenError("No tenés permiso para anular esta orden");
    }
    const today = todayInBolivia();
    const orderDate = order.created_at.split("T")[0];
    if (orderDate !== today) {
      throw new ForbiddenError("Solo podés anular órdenes del día actual");
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
});
