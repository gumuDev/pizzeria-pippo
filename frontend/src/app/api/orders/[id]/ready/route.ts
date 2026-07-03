import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiHandler } from "@/lib/api-handler";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const POST = apiHandler(async (request: NextRequest, ctx?: { params: Record<string, string> }) => {
  const params = { id: ctx?.params?.id ?? "" };
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const token = authHeader.slice(7);

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

  if (!profile || !["admin", "cajero", "cocinero"].includes(profile.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, branch_id, kitchen_status, cancelled_at")
    .eq("id", params.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.cancelled_at) {
    return NextResponse.json({ error: "La orden está anulada" }, { status: 409 });
  }

  if (profile.role !== "admin" && profile.branch_id !== order.branch_id) {
    return NextResponse.json({ error: "No tenés permiso para esta orden" }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ kitchen_status: "ready" })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
