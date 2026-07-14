import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { Ingredient } from "../types/ingredient.types";

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

export const IngredientsService = {
  async getIngredients(params: ListIngredientsParams = {}): Promise<ListIngredientsResult> {
    const { showInactive = false, page = 1, pageSize = 10, search } = params;

    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (showInactive) qs.set("showInactive", "true");
    if (search) qs.set("search", search);
    const res = await nestFetch(API_ENDPOINTS.ingredients.list(qs.toString()));
    if (!res.ok) return { data: [], total: 0 };
    return res.json();
  },

  async createIngredient(values: { name: string; unit: string; is_shared_use?: boolean }): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.ingredients.base, { method: "POST", body: JSON.stringify(values) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async updateIngredient(id: string, values: { name: string; unit: string; is_shared_use?: boolean }): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.ingredients.byId(id), { method: "PATCH", body: JSON.stringify(values) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },

  async toggleActive(id: string, is_active: boolean): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.ingredients.byId(id), { method: "PATCH", body: JSON.stringify({ is_active }) });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error };
    }
    return { ok: true };
  },
};
