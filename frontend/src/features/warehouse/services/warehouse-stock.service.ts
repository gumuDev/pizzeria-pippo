import { getToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { WarehouseRow } from "../types/warehouse.types";
import type { IngredientMovement, ProductMovement } from "../types/warehouse-movements.types";

const USE_NEST = process.env.NEXT_PUBLIC_USE_NEST_WAREHOUSE === "true";
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

interface WarehouseStockParams {
  page: number;
  pageSize: number;
  status?: "low" | "ok";
}

interface MovementFilters {
  type?: string;
  ingredientId?: string;
  variantId?: string;
  branchId?: string;
  from?: string;
  to?: string;
}

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

export async function getIngredients(): Promise<{ id: string; name: string; unit: string }[]> {
  const { data } = await supabase.from("ingredients").select("id, name, unit").eq("is_active", true).order("name");
  return data ?? [];
}

export async function getBranches(): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase.from("branches").select("id, name").eq("is_active", true).order("name");
  return data ?? [];
}

export async function getResaleVariants(): Promise<{ id: string; name: string; products: { name: string } | null }[]> {
  if (USE_NEST) {
    const res = await nestFetch("/stock/resale-variants");
    if (!res.ok) return [];
    return res.json();
  }

  const token = await getToken();
  const res = await fetch("/api/stock/resale-variants", { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  return json.data ?? [];
}

export async function fetchWarehouseStock(params: WarehouseStockParams): Promise<{ rows: WarehouseRow[]; total: number }> {
  const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.status) qs.set("status", params.status);

  const res = USE_NEST
    ? await nestFetch(`/warehouse/stock?${qs.toString()}`)
    : await fetch(`/api/warehouse/stock?${qs.toString()}`, { headers: { Authorization: `Bearer ${await getToken()}` } });

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

export async function getWarehouseMovements(filters: MovementFilters): Promise<IngredientMovement[]> {
  const qs = new URLSearchParams();
  if (filters.type) qs.set("type", filters.type);
  if (filters.ingredientId) qs.set("ingredientId", filters.ingredientId);
  if (filters.branchId) qs.set("branchId", filters.branchId);
  if (filters.from) qs.set("from", filters.from);
  if (filters.to) qs.set("to", filters.to);

  const res = USE_NEST
    ? await nestFetch(`/warehouse/movements?${qs.toString()}`)
    : await fetch(`/api/warehouse/movements?${qs.toString()}`, { headers: { Authorization: `Bearer ${await getToken()}` } });

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getWarehouseProductStock(): Promise<{ variant_id: string; quantity: number; min_quantity: number; product_variants: { name: string; products: { name: string } | null } | null }[]> {
  const res = USE_NEST
    ? await nestFetch("/warehouse/product-stock")
    : await fetch("/api/warehouse/product-stock", { headers: { Authorization: `Bearer ${await getToken()}` } });

  const json = await res.json();
  return json.data ?? [];
}

export async function getWarehouseProductMovements(filters: MovementFilters): Promise<ProductMovement[]> {
  const qs = new URLSearchParams();
  if (filters.variantId) qs.set("variantId", filters.variantId);
  if (filters.branchId) qs.set("branchId", filters.branchId);
  if (filters.from) qs.set("from", filters.from);
  if (filters.to) qs.set("to", filters.to);

  const res = USE_NEST
    ? await nestFetch(`/warehouse/product-movements?${qs.toString()}`)
    : await fetch(`/api/warehouse/product-movements?${qs.toString()}`, { headers: { Authorization: `Bearer ${await getToken()}` } });

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function deleteWarehouseStock(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = USE_NEST
    ? await nestFetch(`/warehouse/stock/${id}`, { method: "DELETE" })
    : await fetch(`/api/warehouse/stock/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${await getToken()}` } });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error };
}

export async function adjustWarehouseStock(
  ingredientId: string,
  realQuantity: number,
  notes: string
): Promise<{ ok: boolean; error?: string }> {
  const body = JSON.stringify({ ingredient_id: ingredientId, real_quantity: realQuantity, notes });
  const res = USE_NEST
    ? await nestFetch("/warehouse/adjust", { method: "POST", body })
    : await fetch("/api/warehouse/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body,
      });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error };
}

export async function purchaseWarehouseStock(payload: {
  ingredient_id: string;
  quantity: number;
  notes?: string;
  min_quantity?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const body = JSON.stringify(payload);
  const res = USE_NEST
    ? await nestFetch("/warehouse/purchase", { method: "POST", body })
    : await fetch("/api/warehouse/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body,
      });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error };
}

export async function transferWarehouseStock(payload: {
  ingredient_id: string;
  quantity: number;
  branch_id: string;
  notes?: string;
}): Promise<{ ok: boolean; error?: string; available?: number }> {
  const body = JSON.stringify(payload);
  const res = USE_NEST
    ? await nestFetch("/warehouse/transfer", { method: "POST", body })
    : await fetch("/api/warehouse/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body,
      });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error, available: json.available };
}

export async function purchaseWarehouseProductStock(payload: {
  variant_id: string;
  quantity: number;
  min_quantity?: number;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const body = JSON.stringify(payload);
  const res = USE_NEST
    ? await nestFetch("/warehouse/product-purchase", { method: "POST", body })
    : await fetch("/api/warehouse/product-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body,
      });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error };
}

export async function adjustWarehouseProductStock(payload: {
  variant_id: string;
  real_quantity: number;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const body = JSON.stringify(payload);
  const res = USE_NEST
    ? await nestFetch("/warehouse/product-adjust", { method: "POST", body })
    : await fetch("/api/warehouse/product-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body,
      });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error };
}

export async function transferWarehouseProductStock(payload: {
  variant_id: string;
  quantity: number;
  branch_id: string;
  notes?: string;
}): Promise<{ ok: boolean; error?: string; available?: number }> {
  const body = JSON.stringify(payload);
  const res = USE_NEST
    ? await nestFetch("/warehouse/product-transfer", { method: "POST", body })
    : await fetch("/api/warehouse/product-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body,
      });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error, available: json.available };
}

// warehouse_stock.min_quantity no tiene endpoint dedicado en Next.js (se actualizaba
// directo con Supabase desde el cliente) — se deja fuera del corte a Nest por ahora.
export async function updateMinQuantity(id: string, minQuantity: number): Promise<void> {
  await supabase.from("warehouse_stock").update({ min_quantity: minQuantity }).eq("id", id);
}
