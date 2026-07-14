import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { AppSettings } from "@/features/settings/types";

export async function getSettings(): Promise<AppSettings> {
  const res = await nestFetch(API_ENDPOINTS.settings.base);
  if (!res.ok) throw new Error("Error al cargar la configuración");
  return res.json();
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const res = await nestFetch(API_ENDPOINTS.settings.base, { method: "PUT", body: JSON.stringify(settings) });
  if (!res.ok) throw new Error("Error al guardar la configuración");
}

export async function testConnection(
  telegramBotToken: string,
  chatId: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await nestFetch(API_ENDPOINTS.settings.test, {
    method: "POST",
    body: JSON.stringify({ telegram_bot_token: telegramBotToken, telegram_chat_id: chatId }),
  });
  return res.json();
}
