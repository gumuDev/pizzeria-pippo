import { getToken } from "@/lib/auth";
import type { VariantType } from "../types/variant-type.types";

const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

function baseUrl(path: string): string {
  return `${NEST_API_URL}${path}`;
}

export const VariantTypesService = {
  async getVariantTypes(onlyActive = false): Promise<VariantType[]> {
    const token = await getToken();
    const params = onlyActive ? "" : "?onlyActive=false";
    const res = await fetch(`${baseUrl("/variant-types")}${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async create(name: string, token: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(baseUrl("/variant-types"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    if (res.ok) return { ok: true };
    const { error } = await res.json();
    return { ok: false, error };
  },

  async update(id: string, name: string, token: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`${baseUrl("/variant-types")}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    if (res.ok) return { ok: true };
    const { error } = await res.json();
    return { ok: false, error };
  },

  async toggle(id: string, is_active: boolean, token: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`${baseUrl("/variant-types")}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active }),
    });
    if (res.ok) return { ok: true };
    const { error } = await res.json();
    return { ok: false, error };
  },
};
