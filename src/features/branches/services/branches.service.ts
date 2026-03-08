import { supabase } from "@/lib/supabase";
import type { Branch } from "../types/branch.types";

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export const BranchesService = {
  async getBranches(showInactive = false): Promise<Branch[]> {
    const token = await getToken();
    const res = await fetch(`/api/branches${showInactive ? "?showInactive=true" : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createBranch(values: { name: string; address?: string }): Promise<{ ok: boolean; error?: string }> {
    const token = await getToken();
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async updateBranch(id: string, values: { name: string; address?: string }): Promise<{ ok: boolean; error?: string }> {
    const token = await getToken();
    const res = await fetch(`/api/branches/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async toggleActive(id: string, is_active: boolean): Promise<{ ok: boolean; error?: string; cashiers?: { id: string; full_name: string }[] }> {
    const token = await getToken();
    const res = await fetch(`/api/branches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error, cashiers: data.cashiers };
    }
    return { ok: true };
  },
};
