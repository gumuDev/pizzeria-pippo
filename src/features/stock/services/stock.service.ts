import { supabase } from "@/lib/supabase";
import { ok, fail, type ServiceResult } from "@/lib/errors";
import type { StockRow, Movement, Ingredient, Branch } from "../types/stock.types";

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export const StockService = {
  async getBranches(): Promise<Branch[]> {
    const { data } = await supabase.from("branches").select("*").order("name");
    return data ?? [];
  },

  async getIngredients(): Promise<Ingredient[]> {
    const { data } = await supabase.from("ingredients").select("*").order("name");
    return data ?? [];
  },

  async getStock(branchId: string): Promise<StockRow[]> {
    const token = await getToken();
    const res = await fetch(`/api/stock?branchId=${branchId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getAlerts(branchId: string): Promise<StockRow[]> {
    const token = await getToken();
    const res = await fetch(`/api/stock/alerts?branchId=${branchId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getMovements(branchId: string): Promise<Movement[]> {
    const token = await getToken();
    const res = await fetch(`/api/stock/movements?branchId=${branchId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async purchase(payload: { branch_id: string; ingredient_id: string; quantity: number; min_quantity?: number }): Promise<ServiceResult> {
    const token = await getToken();
    const res = await fetch("/api/stock/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al registrar la compra");
  },

  async adjust(payload: { branch_id: string; ingredient_id: string; real_quantity: number; notes?: string }): Promise<ServiceResult> {
    const token = await getToken();
    const res = await fetch("/api/stock/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al registrar el ajuste");
  },

  async updateMinQuantity(stockId: string, min_quantity: number): Promise<boolean> {
    const { error } = await supabase
      .from("branch_stock")
      .update({ min_quantity })
      .eq("id", stockId);
    return !error;
  },
};
