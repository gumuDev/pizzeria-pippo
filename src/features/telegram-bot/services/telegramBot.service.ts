import { AuthorizedChat, ChatFormValues } from "@/features/telegram-bot/types";
import { supabase } from "@/lib/supabase";

async function getAuthHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ""}` };
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
