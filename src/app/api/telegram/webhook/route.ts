import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processAIMessage, checkAndIncrementQuota } from "@/lib/telegram-ai";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function sendTelegramDocument(token: string, chatId: string, buffer: Buffer, filename: string) {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("document", new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
  await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: "POST",
    body: form,
  });
}

// Public endpoint — Telegram calls this for every message received by the bot.
// Auth is verified via X-Telegram-Bot-Api-Secret-Token header.
export async function POST(req: NextRequest) {
  const supabase = getServiceClient();

  // 1. Verify secret token
  const { data: secretRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "telegram_webhook_secret")
    .single();

  const expectedSecret = (secretRow as { value: string } | null)?.value ?? "";
  const receivedSecret = req.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // 2. Check bot is enabled
  const { data: enabledRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "telegram_ai_enabled")
    .single();

  if ((enabledRow as { value: string } | null)?.value !== "true") {
    return NextResponse.json({ ok: true }); // silently ignore
  }

  // 3. Parse Telegram payload
  const body = await req.json() as {
    message?: {
      text?: string;
      chat: { id: number; type: string };
    };
  };

  const message = body.message;
  if (!message?.text) return NextResponse.json({ ok: true }); // ignore non-text (stickers, photos, etc.)

  const chatId = String(message.chat.id);
  const chatType = message.chat.type; // "private", "group", "supergroup"
  const text = message.text;

  // 4. Check if chat is authorized
  const { data: authChat } = await supabase
    .from("telegram_authorized_chats")
    .select("id, plan, is_active, type")
    .eq("chat_id", chatId)
    .single();

  const authorizedChat = authChat as { id: string; plan: string; is_active: boolean; type: string } | null;

  if (!authorizedChat?.is_active) {
    return NextResponse.json({ ok: true }); // not authorized — ignore silently
  }

  // 5. For group chats: process all text messages (members are assumed to be admins)
  // For personal chats: process directly
  // (Future: could require @mention in groups)
  const isGroup = chatType === "group" || chatType === "supergroup";
  if (isGroup && authorizedChat.type !== "group") {
    return NextResponse.json({ ok: true });
  }

  // 6. Get bot token
  const { data: tokenRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "telegram_bot_token")
    .single();

  const botToken = (tokenRow as { value: string } | null)?.value ?? "";
  if (!botToken) return NextResponse.json({ ok: true });

  // 7. Check quota
  const quota = await checkAndIncrementQuota(chatId, authorizedChat.plan);
  if (!quota.allowed) {
    const planName = authorizedChat.plan.charAt(0).toUpperCase() + authorizedChat.plan.slice(1);
    await sendTelegramMessage(
      botToken,
      chatId,
      `⛔ Alcanzaste el límite de ${quota.limit} mensajes por día del plan ${planName}.\n\nTu cuota se renueva mañana a las 00:00.`
    );
    return NextResponse.json({ ok: true });
  }

  // 8. Process message with AI
  const response = await processAIMessage(chatId, text);

  // 9. Send response
  if (response.type === "file" && Buffer.isBuffer(response.content)) {
    await sendTelegramDocument(botToken, chatId, response.content, response.filename ?? "reporte.xlsx");
  } else {
    await sendTelegramMessage(botToken, chatId, String(response.content));
  }

  return NextResponse.json({ ok: true });
}
