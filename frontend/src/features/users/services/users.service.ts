import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { BranchesService } from "@/features/branches/services/branches.service";
import type { User, Branch, CreateUserPayload, UpdateUserPayload } from "../types/user.types";

export const UsersService = {
  async getUsers(): Promise<User[]> {
    const res = await nestFetch(API_ENDPOINTS.users.base);
    if (!res.ok) return [];
    return res.json();
  },

  async getBranches(): Promise<Branch[]> {
    const branches = await BranchesService.getBranches();
    return branches.map((b) => ({ id: b.id, name: b.name }));
  },

  async createUser(payload: CreateUserPayload): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.users.base, { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.users.byId(id), { method: "PUT", body: JSON.stringify(payload) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async toggleBan(id: string, ban: boolean): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.users.byId(id), { method: "PATCH", body: JSON.stringify({ ban }) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async deleteUser(id: string): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.users.byId(id), { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },
};
