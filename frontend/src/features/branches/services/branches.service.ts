import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { Branch } from "../types/branch.types";

export const BranchesService = {
  async getBranches(showInactive = false): Promise<Branch[]> {
    const res = await nestFetch(API_ENDPOINTS.branches.list(showInactive));
    if (!res.ok) return [];
    return res.json();
  },

  async createBranch(values: { name: string; address?: string; phone?: string; expected_start_time?: string }): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.branches.base, { method: "POST", body: JSON.stringify(values) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async updateBranch(id: string, values: { name: string; address?: string; phone?: string; expected_start_time?: string }): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.branches.byId(id), { method: "PUT", body: JSON.stringify(values) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async toggleActive(id: string, is_active: boolean): Promise<{ ok: boolean; error?: string; cashiers?: { id: string; full_name: string }[] }> {
    const res = await nestFetch(API_ENDPOINTS.branches.byId(id), { method: "PATCH", body: JSON.stringify({ is_active }) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error, cashiers: data.cashiers };
    }
    return { ok: true };
  },

  async deleteBranch(id: string): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.branches.byId(id), { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },
};
