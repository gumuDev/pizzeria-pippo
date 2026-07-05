import { getToken } from "@/lib/auth";
import { AppSettings } from "@/features/settings/types";

const USE_NEST = process.env.NEXT_PUBLIC_USE_NEST_SETTINGS === "true";
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

function baseUrl(path: string): string {
  return USE_NEST ? `${NEST_API_URL}${path}` : `/api${path}`;
}

async function getAuthHeader(): Promise<HeadersInit> {
  return { Authorization: `Bearer ${await getToken()}` };
}

export async function getSettings(): Promise<AppSettings> {
  const headers = await getAuthHeader();
  const res = await fetch(baseUrl("/settings"), { headers });
  if (!res.ok) throw new Error("Error al cargar la configuración");
  return res.json();
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const headers = await getAuthHeader();
  const res = await fetch(baseUrl("/settings"), {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Error al guardar la configuración");
}

export async function testConnection(
  token: string,
  chatId: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const headers = await getAuthHeader();
  const res = await fetch(baseUrl("/settings/test"), {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_bot_token: token, telegram_chat_id: chatId }),
  });
  return res.json();
}
