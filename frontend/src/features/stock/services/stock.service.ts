import { supabase } from "@/lib/supabase";
import { getToken } from "@/lib/auth";
import { ok, fail, type ServiceResult } from "@/lib/errors";
import type { StockRow, Movement, Ingredient, Branch, ProductStockRow, ProductMovement } from "../types/stock.types";

const USE_NEST = process.env.NEXT_PUBLIC_USE_NEST_STOCK === "true";
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

interface ListParams {
  branchId: string;
  page?: number;
  pageSize?: number;
}

interface ListResult<T> {
  data: T[];
  total: number;
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

export const StockService = {
  async getBranches(): Promise<Branch[]> {
    const { data } = await supabase.from("branches").select("*").order("name");
    return data ?? [];
  },

  async getIngredients(): Promise<Ingredient[]> {
    const { data } = await supabase.from("ingredients").select("*").order("name");
    return data ?? [];
  },

  async getStock(params: ListParams): Promise<ListResult<StockRow>> {
    const { branchId, page = 1, pageSize = 10 } = params;

    if (USE_NEST) {
      const qs = new URLSearchParams({ branchId, page: String(page), pageSize: String(pageSize) });
      const res = await nestFetch(`/stock?${qs.toString()}`);
      if (!res.ok) return { data: [], total: 0 };
      return res.json();
    }

    const token = await getToken();
    const qs = new URLSearchParams({ branchId, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/stock?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    return { data: json.data ?? [], total: json.total ?? 0 };
  },

  async getAlerts(branchId: string): Promise<StockRow[]> {
    if (USE_NEST) {
      const res = await nestFetch(`/stock/alerts?branchId=${branchId}`);
      if (!res.ok) return [];
      return res.json();
    }

    const token = await getToken();
    const res = await fetch(`/api/stock/alerts?branchId=${branchId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getMovements(params: ListParams): Promise<ListResult<Movement>> {
    const { branchId, page = 1, pageSize = 10 } = params;

    if (USE_NEST) {
      const qs = new URLSearchParams({ branchId, page: String(page), pageSize: String(pageSize) });
      const res = await nestFetch(`/stock/movements?${qs.toString()}`);
      if (!res.ok) return { data: [], total: 0 };
      return res.json();
    }

    const token = await getToken();
    const qs = new URLSearchParams({ branchId, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/stock/movements?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    return { data: json.data ?? [], total: json.total ?? 0 };
  },

  async purchase(payload: { branch_id: string; ingredient_id: string; quantity: number; min_quantity?: number }): Promise<ServiceResult> {
    if (USE_NEST) {
      const res = await nestFetch("/stock/purchase", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) return ok(undefined);
      const data = await res.json().catch(() => ({}));
      return fail(data.error ?? "Error al registrar la compra");
    }

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
    if (USE_NEST) {
      const res = await nestFetch("/stock/adjust", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) return ok(undefined);
      const data = await res.json().catch(() => ({}));
      return fail(data.error ?? "Error al registrar el ajuste");
    }

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

  async getProductStock(branchId: string): Promise<ProductStockRow[]> {
    if (USE_NEST) {
      const res = await nestFetch(`/stock/products?branchId=${branchId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    }

    const token = await getToken();
    const res = await fetch(`/api/stock/products?branchId=${branchId}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    return json.data ?? [];
  },

  async getProductMovements(params: ListParams): Promise<ListResult<ProductMovement>> {
    const { branchId, page = 1, pageSize = 10 } = params;

    if (USE_NEST) {
      const qs = new URLSearchParams({ branchId, page: String(page), pageSize: String(pageSize) });
      const res = await nestFetch(`/stock/product-movements?${qs.toString()}`);
      if (!res.ok) return { data: [], total: 0 };
      return res.json();
    }

    const token = await getToken();
    const qs = new URLSearchParams({ branchId, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/stock/product-movements?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    return { data: json.data ?? [], total: json.total ?? 0 };
  },

  async getResaleVariants(): Promise<{ id: string; name: string; products: { id: string; name: string } | null }[]> {
    if (USE_NEST) {
      const res = await nestFetch("/stock/resale-variants");
      if (!res.ok) return [];
      return res.json();
    }

    const token = await getToken();
    const res = await fetch("/api/stock/resale-variants", { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    return json.data ?? [];
  },

  async productPurchase(payload: { branch_id: string; variant_id: string; quantity: number; min_quantity?: number }): Promise<ServiceResult> {
    if (USE_NEST) {
      const res = await nestFetch("/stock/product-purchase", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) return ok(undefined);
      const data = await res.json().catch(() => ({}));
      return fail(data.error ?? "Error al registrar la compra");
    }

    const token = await getToken();
    const res = await fetch("/api/stock/product-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al registrar la compra");
  },

  async productAdjust(payload: { branch_id: string; variant_id: string; real_quantity: number; notes?: string }): Promise<ServiceResult> {
    if (USE_NEST) {
      const res = await nestFetch("/stock/product-adjust", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) return ok(undefined);
      const data = await res.json().catch(() => ({}));
      return fail(data.error ?? "Error al registrar el ajuste");
    }

    const token = await getToken();
    const res = await fetch("/api/stock/product-adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al registrar el ajuste");
  },

  async updateMinQuantity(stockId: string, min_quantity: number): Promise<boolean> {
    if (USE_NEST) {
      const res = await nestFetch(`/stock/${stockId}`, { method: "PATCH", body: JSON.stringify({ min_quantity }) });
      return res.ok;
    }

    const { error } = await supabase
      .from("branch_stock")
      .update({ min_quantity })
      .eq("id", stockId);
    return !error;
  },

  async updateProductMinQuantity(stockId: string, min_quantity: number): Promise<boolean> {
    if (USE_NEST) {
      const res = await nestFetch(`/stock/products/${stockId}`, { method: "PATCH", body: JSON.stringify({ min_quantity }) });
      return res.ok;
    }

    const { error } = await supabase
      .from("branch_product_stock")
      .update({ min_quantity })
      .eq("id", stockId);
    return !error;
  },
};
