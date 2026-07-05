import { getToken } from "@/lib/auth";
import { BranchesService } from "@/features/branches/services/branches.service";
import type { User, Branch, CreateUserPayload, UpdateUserPayload } from "../types/user.types";

const USE_NEST = process.env.NEXT_PUBLIC_USE_NEST_USERS === "true";
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

function baseUrl(path: string): string {
  return USE_NEST ? `${NEST_API_URL}${path}` : `/api${path}`;
}

export const UsersService = {
  async getUsers(): Promise<User[]> {
    const token = await getToken();
    const res = await fetch(baseUrl("/users"), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    return res.json();
  },

  async getBranches(): Promise<Branch[]> {
    const branches = await BranchesService.getBranches();
    return branches.map((b) => ({ id: b.id, name: b.name }));
  },

  async createUser(payload: CreateUserPayload): Promise<{ ok: boolean; error?: string }> {
    const token = await getToken();
    const res = await fetch(baseUrl("/users"), {
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
    const res = await fetch(`${baseUrl("/users")}/${id}`, {
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

  async toggleBan(id: string, ban: boolean): Promise<{ ok: boolean; error?: string }> {
    const token = await getToken();
    const res = await fetch(`${baseUrl("/users")}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ban }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async deleteUser(id: string): Promise<{ ok: boolean; error?: string }> {
    const token = await getToken();
    const res = await fetch(`${baseUrl("/users")}/${id}`, {
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
