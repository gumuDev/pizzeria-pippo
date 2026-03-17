import { supabase } from "@/lib/supabase";
import type { WarehouseRow } from "../types/warehouse.types";

async function getToken(): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  return session.session?.access_token ?? "";
}

export async function fetchWarehouseStock(url: string): Promise<{ rows: WarehouseRow[]; total: number }> {
  const token = await getToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  if (!json.data) return { rows: [], total: 0 };
  return {
    rows: json.data.map((w: WarehouseRow & { ingredients: { name: string; unit: string } }) => ({
      id: w.id,
      ingredient_id: w.ingredient_id,
      ingredient_name: w.ingredients.name,
      unit: w.ingredients.unit,
      quantity: w.quantity,
      min_quantity: w.min_quantity,
      has_movements: w.has_movements ?? false,
    })),
    total: json.total ?? 0,
  };
}

export async function deleteWarehouseStock(id: string): Promise<{ ok: boolean; error?: string }> {
  const token = await getToken();
  const res = await fetch(`/api/warehouse/stock/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return { ok: res.ok, error: json.error };
}

export async function adjustWarehouseStock(
  ingredientId: string,
  realQuantity: number,
  notes: string
): Promise<{ ok: boolean; error?: string }> {
  const token = await getToken();
  const res = await fetch("/api/warehouse/adjust", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ingredient_id: ingredientId, real_quantity: realQuantity, notes }),
  });
  const json = await res.json();
  return { ok: res.ok, error: json.error };
}

export async function updateMinQuantity(id: string, minQuantity: number): Promise<void> {
  await supabase.from("warehouse_stock").update({ min_quantity: minQuantity }).eq("id", id);
}
