import { supabase } from "@/lib/supabase";
import type { VariantType } from "../types/variant-type.types";

export const VariantTypesService = {
  async getToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  },

  async getVariantTypes(onlyActive = false): Promise<VariantType[]> {
    const token = await VariantTypesService.getToken();
    const params = onlyActive ? "" : "?onlyActive=false";
    const res = await fetch(`/api/variant-types${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async create(name: string, sort_order: number, token: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch("/api/variant-types", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, sort_order }),
    });
    if (res.ok) return { ok: true };
    const { error } = await res.json();
    return { ok: false, error };
  },

  async update(id: string, name: string, sort_order: number, token: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/variant-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, sort_order }),
    });
    if (res.ok) return { ok: true };
    const { error } = await res.json();
    return { ok: false, error };
  },

  async toggle(id: string, is_active: boolean, token: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/variant-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active }),
    });
    if (res.ok) return { ok: true };
    const { error } = await res.json();
    return { ok: false, error };
  },
};
