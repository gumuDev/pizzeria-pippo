import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { ok, fail, type ServiceResult } from "@/lib/errors";
import { IngredientsService } from "@/features/ingredients/services/ingredients.service";
import { BranchesService } from "@/features/branches/services/branches.service";
import type { StockRow, Movement, Ingredient, Branch, ProductStockRow, ProductMovement } from "../types/stock.types";

interface ListParams {
  branchId: string;
  page?: number;
  pageSize?: number;
}

interface ListResult<T> {
  data: T[];
  total: number;
}

export const StockService = {
  async getBranches(): Promise<Branch[]> {
    return BranchesService.getBranches();
  },

  async getIngredients(): Promise<Ingredient[]> {
    const { data } = await IngredientsService.getIngredients({ pageSize: 9999 });
    return data;
  },

  async getStock(params: ListParams): Promise<ListResult<StockRow>> {
    const { branchId, page = 1, pageSize = 10 } = params;
    const qs = new URLSearchParams({ branchId, page: String(page), pageSize: String(pageSize) });
    const res = await nestFetch(API_ENDPOINTS.stock.list(qs.toString()));
    if (!res.ok) return { data: [], total: 0 };
    return res.json();
  },

  async getAlerts(branchId: string): Promise<StockRow[]> {
    const res = await nestFetch(API_ENDPOINTS.stock.alerts(branchId));
    if (!res.ok) return [];
    return res.json();
  },

  async getMovements(params: ListParams): Promise<ListResult<Movement>> {
    const { branchId, page = 1, pageSize = 10 } = params;
    const qs = new URLSearchParams({ branchId, page: String(page), pageSize: String(pageSize) });
    const res = await nestFetch(API_ENDPOINTS.stock.movements(qs.toString()));
    if (!res.ok) return { data: [], total: 0 };
    return res.json();
  },

  async purchase(payload: { branch_id: string; ingredient_id: string; quantity: number; min_quantity?: number }): Promise<ServiceResult> {
    const res = await nestFetch(API_ENDPOINTS.stock.purchase, { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al registrar la compra");
  },

  async adjust(payload: { branch_id: string; ingredient_id: string; real_quantity: number; notes?: string }): Promise<ServiceResult> {
    const res = await nestFetch(API_ENDPOINTS.stock.adjust, { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al registrar el ajuste");
  },

  async getProductStock(branchId: string): Promise<ProductStockRow[]> {
    const res = await nestFetch(API_ENDPOINTS.stock.productStock(branchId));
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  },

  async getProductMovements(params: ListParams): Promise<ListResult<ProductMovement>> {
    const { branchId, page = 1, pageSize = 10 } = params;
    const qs = new URLSearchParams({ branchId, page: String(page), pageSize: String(pageSize) });
    const res = await nestFetch(API_ENDPOINTS.stock.productMovements(qs.toString()));
    if (!res.ok) return { data: [], total: 0 };
    return res.json();
  },

  async getResaleVariants(): Promise<{ id: string; name: string; products: { id: string; name: string } | null }[]> {
    const res = await nestFetch(API_ENDPOINTS.stock.resaleVariants);
    if (!res.ok) return [];
    return res.json();
  },

  async productPurchase(payload: { branch_id: string; variant_id: string; quantity: number; min_quantity?: number }): Promise<ServiceResult> {
    const res = await nestFetch(API_ENDPOINTS.stock.productPurchase, { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al registrar la compra");
  },

  async productAdjust(payload: { branch_id: string; variant_id: string; real_quantity: number; notes?: string }): Promise<ServiceResult> {
    const res = await nestFetch(API_ENDPOINTS.stock.productAdjust, { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al registrar el ajuste");
  },

  async updateMinQuantity(stockId: string, min_quantity: number): Promise<boolean> {
    const res = await nestFetch(API_ENDPOINTS.stock.byId(stockId), { method: "PATCH", body: JSON.stringify({ min_quantity }) });
    return res.ok;
  },

  async updateProductMinQuantity(stockId: string, min_quantity: number): Promise<boolean> {
    const res = await nestFetch(API_ENDPOINTS.stock.productById(stockId), { method: "PATCH", body: JSON.stringify({ min_quantity }) });
    return res.ok;
  },
};
