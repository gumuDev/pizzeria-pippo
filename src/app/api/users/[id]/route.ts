import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getAuthClient(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

async function requireAdmin(request: NextRequest) {
  const authClient = getAuthClient(request);
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { full_name, role, branch_id } = body;
  const serviceClient = getServiceClient();

  const { error: authUpdateError } = await serviceClient.auth.admin.updateUserById(
    params.id,
    { user_metadata: { full_name, role } }
  );
  if (authUpdateError) return NextResponse.json({ error: authUpdateError.message }, { status: 500 });

  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ full_name, role, branch_id: branch_id ?? null })
    .eq("id", params.id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// Toggle ban (desactivar / reactivar cuenta)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { ban } = await request.json();
  const serviceClient = getServiceClient();

  const { error } = await serviceClient.auth.admin.updateUserById(params.id, {
    ban_duration: ban ? "876600h" : "none", // 100 años ≈ permanente
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const serviceClient = getServiceClient();

  // Verificar si tiene órdenes asociadas
  const { count } = await serviceClient
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("cashier_id", params.id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: el usuario tiene ventas registradas. Desactiva la cuenta en su lugar." },
      { status: 409 }
    );
  }

  const { error } = await serviceClient.auth.admin.deleteUser(params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
