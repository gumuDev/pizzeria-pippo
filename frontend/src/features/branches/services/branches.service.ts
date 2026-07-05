import { getToken } from "@/lib/auth";
import type { Branch } from "../types/branch.types";

const USE_NEST = process.env.NEXT_PUBLIC_USE_NEST_BRANCHES === "true";
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

async function nestFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  return fetch(`${NEST_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

export const BranchesService = {
  async getBranches(showInactive = false): Promise<Branch[]> {
    if (USE_NEST) {
      const res = await nestFetch(`/branches${showInactive ? "?showInactive=true" : ""}`);
      if (!res.ok) return [];
      return res.json();
    }

    const token = await getToken();
    const res = await fetch(`/api/branches${showInactive ? "?showInactive=true" : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createBranch(values: { name: string; address?: string }): Promise<{ ok: boolean; error?: string }> {
    if (USE_NEST) {
      const res = await nestFetch("/branches", { method: "POST", body: JSON.stringify(values) });
      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data.error };
      }
      return { ok: true };
    }

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
    if (USE_NEST) {
      const res = await nestFetch(`/branches/${id}`, { method: "PUT", body: JSON.stringify(values) });
      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data.error };
      }
      return { ok: true };
    }

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
    if (USE_NEST) {
      const res = await nestFetch(`/branches/${id}`, { method: "PATCH", body: JSON.stringify({ is_active }) });
      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data.error, cashiers: data.cashiers };
      }
      return { ok: true };
    }

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
