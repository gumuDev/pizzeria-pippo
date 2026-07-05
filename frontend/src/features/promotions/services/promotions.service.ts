import { supabase } from "@/lib/supabase";
import { getToken } from "@/lib/auth";
import { ok, fail, type ServiceResult } from "@/lib/errors";
import type { Promotion, Variant, Branch } from "../types/promotion.types";

const USE_NEST = process.env.NEXT_PUBLIC_USE_NEST_PROMOTIONS === "true";
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

export const PromotionsService = {
  async getBranches(): Promise<Branch[]> {
    const { data } = await supabase.from("branches").select("id, name").order("name");
    return data ?? [];
  },

  async getPromotion(id: string): Promise<Promotion | null> {
    if (USE_NEST) {
      const res = await nestFetch(`/promotions/${id}`);
      if (!res.ok) return null;
      return res.json();
    }

    const token = await getToken();
    const res = await fetch(`/api/promotions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
  },

  async getPromotions(showInactive = false): Promise<Promotion[]> {
    if (USE_NEST) {
      const qs = showInactive ? "?showInactive=true" : "";
      const res = await nestFetch(`/promotions${qs}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }

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
    if (USE_NEST) {
      const res = await nestFetch("/promotions", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) return ok(undefined);
      const data = await res.json().catch(() => ({}));
      return fail(data.error ?? "Error al crear la promoción");
    }

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
    if (USE_NEST) {
      const res = await nestFetch(`/promotions/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      if (res.ok) return ok(undefined);
      const data = await res.json().catch(() => ({}));
      return fail(data.error ?? "Error al actualizar la promoción");
    }

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
    if (USE_NEST) {
      const res = await nestFetch(`/promotions/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      if (res.ok) return ok(undefined);
      const data = await res.json().catch(() => ({}));
      return fail(data.error ?? "Error al actualizar la promoción");
    }

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
