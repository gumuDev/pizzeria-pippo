import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { VariantType } from "../types/variant-type.types";

export const VariantTypesService = {
  async getVariantTypes(onlyActive = false): Promise<VariantType[]> {
    const params = onlyActive ? "" : "?onlyActive=false";
    const res = await nestFetch(API_ENDPOINTS.variantTypes.list(params));
    if (!res.ok) return [];
    return res.json();
  },

  async create(name: string): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.variantTypes.base, { method: "POST", body: JSON.stringify({ name }) });
    if (res.ok) return { ok: true };
    const { error } = await res.json();
    return { ok: false, error };
  },

  async update(id: string, name: string): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.variantTypes.byId(id), { method: "PUT", body: JSON.stringify({ name }) });
    if (res.ok) return { ok: true };
    const { error } = await res.json();
    return { ok: false, error };
  },

  async toggle(id: string, is_active: boolean): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(API_ENDPOINTS.variantTypes.byId(id), { method: "PATCH", body: JSON.stringify({ is_active }) });
    if (res.ok) return { ok: true };
    const { error } = await res.json();
    return { ok: false, error };
  },
};
