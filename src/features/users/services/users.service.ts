import { supabase } from "@/lib/supabase";
import type { User, Branch, CreateUserPayload, UpdateUserPayload } from "../types/user.types";

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export const UsersService = {
  async getUsers(): Promise<User[]> {
    const token = await getToken();
    const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    return res.json();
  },

  async getBranches(): Promise<Branch[]> {
    const token = await getToken();
    const res = await fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    return res.json();
  },

  async createUser(payload: CreateUserPayload): Promise<{ ok: boolean; error?: string }> {
    const token = await getToken();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<{ ok: boolean; error?: string }> {
    const token = await getToken();
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async deleteUser(id: string): Promise<{ ok: boolean; error?: string }> {
    const token = await getToken();
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },
};
