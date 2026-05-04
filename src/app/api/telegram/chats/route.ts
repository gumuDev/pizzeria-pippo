import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { todayInBolivia } from "@/lib/timezone";

async function getAdminServiceClient(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return null;

  const { data: profile } = await userClient.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") return null;

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET(req: NextRequest) {
  const supabase = await getAdminServiceClient(req);
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = todayInBolivia();

  const { data: chats, error } = await supabase
    .from("telegram_authorized_chats")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const chatIds = (chats ?? []).map((c: { chat_id: string }) => c.chat_id);
  const { data: usageRows } = await supabase
    .from("telegram_usage")
    .select("chat_id, message_count")
    .in("chat_id", chatIds)
    .eq("date", today);

  const usageMap: Record<string, number> = Object.fromEntries(
    (usageRows ?? []).map((u: { chat_id: string; message_count: number }) => [u.chat_id, u.message_count])
  );

  const result = (chats ?? []).map((c: Record<string, unknown>) => ({
    ...c,
    messages_today: usageMap[c.chat_id as string] ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const supabase = await getAdminServiceClient(req);
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    chat_id: string;
    type: string;
    label: string;
    plan: string;
  };

  const { error, data } = await supabase
    .from("telegram_authorized_chats")
    .insert({
      chat_id: body.chat_id,
      type: body.type,
      label: body.label,
      plan: body.plan,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
