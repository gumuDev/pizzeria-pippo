import { AppSettings } from "@/features/settings/types";

async function getAuthHeader(): Promise<HeadersInit> {
  const { supabase } = await import("@/lib/supabase");
  const { data: { session } } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ""}` };
}

export async function getSettings(): Promise<AppSettings> {
  const headers = await getAuthHeader();
  const res = await fetch("/api/settings", { headers });
  if (!res.ok) throw new Error("Error al cargar la configuración");
  return res.json();
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const headers = await getAuthHeader();
  const res = await fetch("/api/settings", {
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
  const res = await fetch("/api/settings/test", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_bot_token: token, telegram_chat_id: chatId }),
  });
  return res.json();
}
