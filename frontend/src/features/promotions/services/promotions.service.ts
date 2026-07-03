import { supabase } from "@/lib/supabase";
import { getToken } from "@/lib/auth";
import { ok, fail, type ServiceResult } from "@/lib/errors";
import type { Promotion, Variant, Branch } from "../types/promotion.types";

export const PromotionsService = {
  async getBranches(): Promise<Branch[]> {
    const { data } = await supabase.from("branches").select("id, name").order("name");
    return data ?? [];
  },

  async getPromotion(id: string): Promise<Promotion | null> {
    const token = await getToken();
    const res = await fetch(`/api/promotions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
  },

  async getPromotions(showInactive = false): Promise<Promotion[]> {
    const token = await getToken();
    const url = showInactive ? "/api/promotions?showInactive=true" : "/api/promotions";
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getVariants(): Promise<Variant[]> {
    const { data } = await supabase
      .from("product_variants")
      .select("id, name, products(name)")
      .order("name");
    if (!data) return [];
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      product_name: (row.products as unknown as { name: string } | null)?.name ?? "",
    }));
  },

  async createPromotion(payload: object): Promise<ServiceResult> {
    const token = await getToken();
    const res = await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al crear la promoción");
  },

  async updatePromotion(id: string, payload: object): Promise<ServiceResult> {
    const token = await getToken();
    const res = await fetch(`/api/promotions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al actualizar la promoción");
  },

  async patchPromotion(id: string, patch: object): Promise<ServiceResult> {
    const token = await getToken();
    const res = await fetch(`/api/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al actualizar la promoción");
  },
};
