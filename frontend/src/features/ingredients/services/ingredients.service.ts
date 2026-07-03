import { supabase } from "@/lib/supabase";
import { getToken } from "@/lib/auth";
import type { Ingredient } from "../types/ingredient.types";

const USE_NEST = process.env.NEXT_PUBLIC_USE_NEST_INGREDIENTS === "true";
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

interface ListIngredientsParams {
  showInactive?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
}

interface ListIngredientsResult {
  data: Ingredient[];
  total: number;
}

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

export const IngredientsService = {
  async getIngredients(params: ListIngredientsParams = {}): Promise<ListIngredientsResult> {
    const { showInactive = false, page = 1, pageSize = 10, search } = params;

    if (USE_NEST) {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (showInactive) qs.set("showInactive", "true");
      if (search) qs.set("search", search);
      const res = await nestFetch(`/ingredients?${qs.toString()}`);
      if (!res.ok) return { data: [], total: 0 };
      return res.json();
    }

    const token = await getToken();
    const qs = new URLSearchParams({ showInactive: String(showInactive), page: String(page), pageSize: String(pageSize) });
    if (search) qs.set("search", search);
    const res = await fetch(`/api/ingredients?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.data && Array.isArray(json.data)) return { data: json.data, total: json.total ?? 0 };
    return { data: [], total: 0 };
  },

  async createIngredient(values: { name: string; unit: string }): Promise<{ ok: boolean; error?: string }> {
    if (USE_NEST) {
      const res = await nestFetch("/ingredients", { method: "POST", body: JSON.stringify(values) });
      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data.error };
      }
      return { ok: true };
    }

    const { error } = await supabase.from("ingredients").insert(values);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async updateIngredient(id: string, values: { name: string; unit: string }): Promise<{ ok: boolean; error?: string }> {
    if (USE_NEST) {
      const res = await nestFetch(`/ingredients/${id}`, { method: "PATCH", body: JSON.stringify(values) });
      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data.error };
      }
      return { ok: true };
    }

    const { error } = await supabase.from("ingredients").update(values).eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async toggleActive(id: string, is_active: boolean): Promise<{ ok: boolean; error?: string }> {
    if (USE_NEST) {
      const res = await nestFetch(`/ingredients/${id}`, { method: "PATCH", body: JSON.stringify({ is_active }) });
      if (!res.ok) {
        const data = await res.json();
        return { ok: false, error: data.error };
      }
      return { ok: true };
    }

    const token = await getToken();
    const res = await fetch(`/api/ingredients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },
};
