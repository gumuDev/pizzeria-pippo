import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { telegram_bot_token, telegram_chat_id } = await req.json() as {
    telegram_bot_token: string;
    telegram_chat_id: string;
  };

  if (!telegram_bot_token || !telegram_chat_id) {
    return NextResponse.json({ ok: false, error: "Token y Chat ID son requeridos" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${telegram_bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegram_chat_id,
        text: "✅ *Pizzería Pippo* — Conexión de notificaciones configurada correctamente.",
        parse_mode: "Markdown",
      }),
    });

    const data = await res.json() as { ok: boolean; description?: string };

    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.description ?? "Error desconocido de Telegram" });
    }

    return NextResponse.json({ ok: true, message: "Mensaje de prueba enviado correctamente" });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo conectar con Telegram" });
  }
}
