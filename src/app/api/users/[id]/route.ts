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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = getAuthClient(request);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, role, branch_id } = body;

  const serviceClient = getServiceClient();

  // Update user metadata in auth
  const { error: authUpdateError } = await serviceClient.auth.admin.updateUserById(
    params.id,
    { user_metadata: { full_name, role } }
  );
  if (authUpdateError) return NextResponse.json({ error: authUpdateError.message }, { status: 500 });

  // Update profile table
  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({ full_name, role, branch_id: branch_id ?? null })
    .eq("id", params.id);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = getAuthClient(request);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const serviceClient = getServiceClient();
  const { error } = await serviceClient.auth.admin.deleteUser(params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
