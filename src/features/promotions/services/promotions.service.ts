import { supabase } from "@/lib/supabase";
import type { Promotion, Variant } from "../types/promotion.types";

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export const PromotionsService = {
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

  async createPromotion(payload: object): Promise<boolean> {
    const token = await getToken();
    const res = await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return res.ok;
  },

  async updatePromotion(id: string, payload: object): Promise<boolean> {
    const token = await getToken();
    const res = await fetch(`/api/promotions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return res.ok;
  },

  async patchPromotion(id: string, patch: object): Promise<boolean> {
    const token = await getToken();
    const res = await fetch(`/api/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    return res.ok;
  },
};
