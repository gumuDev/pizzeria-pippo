import { supabase } from "@/lib/supabase";
import type { Ingredient } from "../types/ingredient.types";

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export const IngredientsService = {
  async getIngredients(showInactive = false): Promise<Ingredient[]> {
    let query = supabase.from("ingredients").select("*").order("name", { ascending: true });
    if (!showInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  },

  async createIngredient(values: { name: string; unit: string }): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from("ingredients").insert(values);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async updateIngredient(id: string, values: { name: string; unit: string }): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from("ingredients").update(values).eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async toggleActive(id: string, is_active: boolean): Promise<{ ok: boolean; error?: string }> {
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
