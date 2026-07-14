import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { AuthorizedChat, ChatFormValues } from "@/features/telegram-bot/types";

export async function getBotSettings(keys: string[]): Promise<Record<string, string>> {
  const res = await nestFetch(API_ENDPOINTS.settings.rawByKeys(keys));
  if (!res.ok) return {};
  return res.json();
}

export async function saveBotSettings(updates: { key: string; value: string; updated_at: string }[]): Promise<void> {
  const res = await nestFetch(API_ENDPOINTS.settings.raw, {
    method: "PUT",
    body: JSON.stringify({ updates: updates.map(({ key, value }) => ({ key, value })) }),
  });
  if (!res.ok) throw new Error("Error al guardar la configuración");
}

export async function getAuthorizedChats(): Promise<AuthorizedChat[]> {
  const res = await nestFetch(API_ENDPOINTS.telegram.chats);
  if (!res.ok) throw new Error("Error al cargar los chats");
  return res.json();
}

export async function createAuthorizedChat(values: ChatFormValues): Promise<AuthorizedChat> {
  const res = await nestFetch(API_ENDPOINTS.telegram.chats, {
    method: "POST",
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error("Error al crear el chat");
  return res.json();
}

export async function updateAuthorizedChat(
  id: string,
  values: Partial<Pick<AuthorizedChat, "label" | "plan" | "is_active">>
): Promise<AuthorizedChat> {
  const res = await nestFetch(API_ENDPOINTS.telegram.chatById(id), {
    method: "PUT",
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error("Error al actualizar el chat");
  return res.json();
}

export async function deleteAuthorizedChat(id: string): Promise<void> {
  const res = await nestFetch(API_ENDPOINTS.telegram.chatById(id), { method: "DELETE" });
  if (!res.ok) throw new Error("Error al revocar el chat");
}
