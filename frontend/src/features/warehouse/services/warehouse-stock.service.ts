import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { IngredientsService } from "@/features/ingredients/services/ingredients.service";
import { BranchesService } from "@/features/branches/services/branches.service";
import type { WarehouseRow } from "../types/warehouse.types";
import type { IngredientMovement, ProductMovement } from "../types/warehouse-movements.types";

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

export async function getIngredients(): Promise<{ id: string; name: string; unit: string }[]> {
  const { data } = await IngredientsService.getIngredients({ pageSize: 9999 });
  return data;
}

export async function getBranches(): Promise<{ id: string; name: string }[]> {
  return BranchesService.getBranches();
}

export async function getResaleVariants(): Promise<{ id: string; name: string; products: { name: string } | null }[]> {
  const res = await nestFetch(API_ENDPOINTS.stock.resaleVariants);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchWarehouseStock(params: WarehouseStockParams): Promise<{ rows: WarehouseRow[]; total: number }> {
  const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.status) qs.set("status", params.status);

  const res = await nestFetch(API_ENDPOINTS.warehouse.stock(qs.toString()));

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

  const res = await nestFetch(API_ENDPOINTS.warehouse.movements(qs.toString()));

  const data = await res.json();
  return Array.isArray(data) ? data : [];
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

export async function deleteWarehouseStock(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await nestFetch(API_ENDPOINTS.warehouse.stockById(id), { method: "DELETE" });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, error: json.error };
}

export async function adjustWarehouseStock(
  ingredientId: string,
  realQuantity: number,
  notes: string
): Promise<{ ok: boolean; error?: string }> {
  const body = JSON.stringify({ ingredient_id: ingredientId, real_quantity: realQuantity, notes });
  const res = await nestFetch(API_ENDPOINTS.warehouse.adjust, { method: "POST", body });

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
  const res = await nestFetch(API_ENDPOINTS.warehouse.purchase, { method: "POST", body });

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
  const res = await nestFetch(API_ENDPOINTS.warehouse.transfer, { method: "POST", body });

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

export async function updateMinQuantity(id: string, minQuantity: number): Promise<void> {
  const res = await nestFetch(API_ENDPOINTS.warehouse.stockById(id), {
    method: "PATCH",
    body: JSON.stringify({ min_quantity: minQuantity }),
  });
  if (!res.ok) throw new Error("Error al actualizar la cantidad mínima");
}
