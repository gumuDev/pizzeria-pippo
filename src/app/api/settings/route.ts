import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function maskToken(token: string): string {
  if (!token || token.length < 10) return token;
  return token.slice(0, 6) + "***" + token.slice(-3);
}

async function getAdminSupabase(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  const userSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await userSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = await getAdminSupabase(req);
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rows, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["telegram_bot_token", "telegram_chat_id", "telegram_enabled", "kitchen_late_threshold_minutes"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const config: Record<string, string> = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));

  return NextResponse.json({
    telegram_bot_token: maskToken(config["telegram_bot_token"] ?? ""),
    telegram_chat_id: config["telegram_chat_id"] ?? "",
    telegram_enabled: config["telegram_enabled"] === "true",
    kitchen_late_threshold_minutes: parseInt(config["kitchen_late_threshold_minutes"] ?? "10", 10),
  });
}

export async function PUT(req: NextRequest) {
  const supabase = await getAdminSupabase(req);
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { telegram_bot_token, telegram_chat_id, telegram_enabled, kitchen_late_threshold_minutes } = body as {
    telegram_bot_token: string;
    telegram_chat_id: string;
    telegram_enabled: boolean;
    kitchen_late_threshold_minutes: number;
  };

  const updates = [
    { key: "telegram_chat_id", value: telegram_chat_id ?? "", updated_at: new Date().toISOString() },
    { key: "telegram_enabled", value: String(telegram_enabled ?? false), updated_at: new Date().toISOString() },
    { key: "kitchen_late_threshold_minutes", value: String(kitchen_late_threshold_minutes ?? 10), updated_at: new Date().toISOString() },
  ];

  // Only update token if a new non-masked value was provided
  if (telegram_bot_token && !telegram_bot_token.includes("***")) {
    updates.push({ key: "telegram_bot_token", value: telegram_bot_token, updated_at: new Date().toISOString() });
  }

  const { error } = await supabase
    .from("app_settings")
    .upsert(updates, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
