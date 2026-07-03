import { getToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AuthorizedChat, ChatFormValues } from "@/features/telegram-bot/types";

async function getAuthHeader(): Promise<HeadersInit> {
  return { Authorization: `Bearer ${await getToken()}` };
}

export async function getBotSettings(keys: string[]): Promise<Record<string, string>> {
  const { data: rows } = await supabase.from("app_settings").select("key, value").in("key", keys);
  return Object.fromEntries(
    (rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  );
}

export async function saveBotSettings(updates: { key: string; value: string; updated_at: string }[]): Promise<void> {
  const { error } = await supabase.from("app_settings").upsert(updates, { onConflict: "key" });
  if (error) throw error;
}

export async function getAuthorizedChats(): Promise<AuthorizedChat[]> {
  const headers = await getAuthHeader();
  const res = await fetch("/api/telegram/chats", { headers });
  if (!res.ok) throw new Error("Error al cargar los chats");
  return res.json();
}

export async function createAuthorizedChat(values: ChatFormValues): Promise<AuthorizedChat> {
  const headers = await getAuthHeader();
  const res = await fetch("/api/telegram/chats", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error("Error al crear el chat");
  return res.json();
}

export async function updateAuthorizedChat(
  id: string,
  values: Partial<Pick<AuthorizedChat, "label" | "plan" | "is_active">>
): Promise<AuthorizedChat> {
  const headers = await getAuthHeader();
  const res = await fetch(`/api/telegram/chats/${id}`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error("Error al actualizar el chat");
  return res.json();
}

export async function deleteAuthorizedChat(id: string): Promise<void> {
  const headers = await getAuthHeader();
  const res = await fetch(`/api/telegram/chats/${id}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error("Error al revocar el chat");
}
