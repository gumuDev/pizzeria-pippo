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

export async function GET(request: NextRequest) {
  const authClient = getAuthClient(request);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const serviceClient = getServiceClient();

  const { data: authUsers, error: listError } = await serviceClient.auth.admin.listUsers();
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const { data: profiles, error: profilesError } = await serviceClient
    .from("profiles")
    .select("id, full_name, role, branch_id");
  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

  // Get cashier IDs that have at least one order
  const { data: ordersData } = await serviceClient
    .from("orders")
    .select("cashier_id");
  const usersWithOrders = new Set((ordersData ?? []).map((o: { cashier_id: string }) => o.cashier_id));

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const users = authUsers.users.map((u) => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      full_name: profile?.full_name ?? u.user_metadata?.full_name ?? "",
      role: profile?.role ?? u.user_metadata?.role ?? "cajero",
      branch_id: profile?.branch_id ?? null,
      created_at: u.created_at,
      is_banned: !!u.banned_until,
      has_orders: usersWithOrders.has(u.id),
    };
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const authClient = getAuthClient(request);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { email, password, full_name, role, branch_id } = body;

  const serviceClient = getServiceClient();

  const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 });

  const { error: profileError } = await serviceClient
    .from("profiles")
    .upsert({ id: newUser.user.id, full_name, role, branch_id: branch_id ?? null });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ id: newUser.user.id }, { status: 201 });
}
