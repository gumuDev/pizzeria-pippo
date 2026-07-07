import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { ProductMovement, MovementFilters } from "../types/warehouse-movements.types";

export async function getResaleVariants(): Promise<{ id: string; name: string; products: { name: string } | null }[]> {
  const res = await nestFetch(API_ENDPOINTS.stock.resaleVariants);
  if (!res.ok) return [];
  return res.json();
}

export async function getWarehouseProductStock(): Promise<{ variant_id: string; quantity: number; min_quantity: number; product_variants: { name: string; products: { name: string } | null } | null }[]> {
  const res = await nestFetch(API_ENDPOINTS.warehouse.productStock);

  const json = await res.json();
  return json.data ?? [];
}

export async function getWarehouseProductMovements(filters: MovementFilters): Promise<ProductMovement[]> {
  const qs = new URLSearchParams();
  if (filters.variantId) qs.set("variantId", filters.variantId);
  if (filters.branchId) qs.set("branchId", filters.branchId);
  if (filters.from) qs.set("from", filters.from);
  if (filters.to) qs.set("to", filters.to);

  const res = await nestFetch(API_ENDPOINTS.warehouse.productMovements(qs.toString()));

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function purchaseWarehouseProductStock(payload: {
  variant_id: string;
  quantity: number;
  min_quantity?: number;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const body = JSON.stringify(payload);
  const res = await nestFetch(API_ENDPOINTS.warehouse.productPurchase, { method: "POST", body });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error };
}

export async function adjustWarehouseProductStock(payload: {
  variant_id: string;
  real_quantity: number;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const body = JSON.stringify(payload);
  const res = await nestFetch(API_ENDPOINTS.warehouse.productAdjust, { method: "POST", body });

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
  const res = await nestFetch(API_ENDPOINTS.warehouse.productTransfer, { method: "POST", body });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error, available: json.available };
}
