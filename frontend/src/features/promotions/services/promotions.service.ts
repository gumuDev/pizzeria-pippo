import { nestFetch } from "@/lib/nestFetch";
import { ok, fail, type ServiceResult } from "@/lib/errors";
import { BranchesService } from "@/features/branches/services/branches.service";
import type { Promotion, Variant, Branch } from "../types/promotion.types";

export const PromotionsService = {
  async getBranches(): Promise<Branch[]> {
    return BranchesService.getBranches();
  },

  async getPromotion(id: string): Promise<Promotion | null> {
    const res = await nestFetch(`/promotions/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getPromotions(showInactive = false): Promise<Promotion[]> {
    const qs = showInactive ? "?showInactive=true" : "";
    const res = await nestFetch(`/promotions${qs}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getVariants(): Promise<Variant[]> {
    const res = await nestFetch("/products/all-variants");
    if (!res.ok) return [];
    return res.json();
  },

  async createPromotion(payload: object): Promise<ServiceResult> {
    const res = await nestFetch("/promotions", { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al crear la promoción");
  },

  async updatePromotion(id: string, payload: object): Promise<ServiceResult> {
    const res = await nestFetch(`/promotions/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al actualizar la promoción");
  },

  async patchPromotion(id: string, patch: object): Promise<ServiceResult> {
    const res = await nestFetch(`/promotions/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al actualizar la promoción");
  },
};
