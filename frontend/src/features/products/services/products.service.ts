import { supabase } from "@/lib/supabase";
import { getToken } from "@/lib/auth";
import { ok, fail, type ServiceResult } from "@/lib/errors";
import type { ProductVariant } from "@pippo/shared";
import type { Product, Ingredient, Branch, Variant, Step1Data } from "../types/product.types";

const USE_NEST = process.env.NEXT_PUBLIC_USE_NEST_PRODUCTS === "true";
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

interface ListProductsParams {
  showInactive?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string | null;
}

interface ListProductsResult {
  data: Product[];
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

export const ProductsService = {
  async getProducts(params: ListProductsParams = {}): Promise<ListProductsResult> {
    const { showInactive = false, page = 1, pageSize = 10, search, category } = params;

    if (USE_NEST) {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (showInactive) qs.set("showInactive", "true");
      if (search) qs.set("search", search);
      if (category) qs.set("category", category);
      const res = await nestFetch(`/products?${qs.toString()}`);
      if (!res.ok) return { data: [], total: 0 };
      return res.json();
    }

    const token = await getToken();
    const qs = new URLSearchParams({ showInactive: String(showInactive), page: String(page), pageSize: String(pageSize) });
    if (search) qs.set("search", search);
    if (category) qs.set("category", category);
    const res = await fetch(`/api/products?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    return { data: json.data ?? [], total: json.total ?? 0 };
  },

  async getIngredients(): Promise<Ingredient[]> {
    const { data } = await supabase.from("ingredients").select("*").eq("is_active", true).order("name");
    return data ?? [];
  },

  async getBranches(): Promise<Branch[]> {
    const { data } = await supabase.from("branches").select("*").eq("is_active", true).order("name");
    return data ?? [];
  },

  async getProductName(id: string): Promise<string | null> {
    const { data } = await supabase.from("products").select("name").eq("id", id).single();
    return data?.name ?? null;
  },

  // Shape rica (con branches/ingredients denormalizados) — la usa la vista de detalle;
  // la vista de edición solo toma el subset básico (Product) via `as`.
  async getProductDetail(id: string) {
    if (USE_NEST) {
      const res = await nestFetch(`/products/${id}`);
      if (!res.ok) return null;
      return res.json();
    }

    const { data } = await supabase
      .from("products")
      .select("*, product_variants(*, branch_prices(*, branches(name)), recipes(*, ingredients(name, unit)))")
      .eq("id", id)
      .single();
    return data ?? null;
  },

  async getVariantsWithDetails(productId: string): Promise<ProductVariant[]> {
    if (USE_NEST) {
      const res = await nestFetch(`/products/${productId}/variants`);
      if (!res.ok) return [];
      return res.json();
    }

    const { data } = await supabase
      .from("product_variants")
      .select("*, branch_prices(*), recipes(ingredient_id, quantity, apply_condition)")
      .eq("product_id", productId);
    return data ?? [];
  },

  async createProduct(payload: unknown, token: string): Promise<ServiceResult> {
    if (USE_NEST) {
      const res = await nestFetch("/products", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) return ok(undefined);
      const data = await res.json().catch(() => ({}));
      return fail(data.error ?? "Error al crear el producto");
    }

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al crear el producto");
  },

  async updateProduct(id: string, payload: unknown, token: string): Promise<ServiceResult> {
    if (USE_NEST) {
      const res = await nestFetch(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      if (res.ok) return ok(undefined);
      const data = await res.json().catch(() => ({}));
      return fail(data.error ?? "Error al actualizar el producto");
    }

    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) return ok(undefined);
    const data = await res.json().catch(() => ({}));
    return fail(data.error ?? "Error al actualizar el producto");
  },

  async patchProduct(id: string, payload: unknown, token: string): Promise<{ ok: boolean; error?: string }> {
    if (USE_NEST) {
      const res = await nestFetch(`/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      if (res.ok) return { ok: true };
      const { error } = await res.json();
      return { ok: false, error };
    }

    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };
    const { error } = await res.json();
    return { ok: false, error };
  },

  async uploadImage(file: File, token: string): Promise<{ url?: string; error?: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      const { url } = await res.json();
      return { url };
    }
    const { error } = await res.json();
    return { error };
  },

  buildPayload(step1Data: Step1Data, imageUrl: string, variants: Variant[]) {
    const cleanVariants = variants
      .filter((v) => v.is_active !== false)
      .map((v) => ({
        ...v,
        recipes: v.recipes.filter((r) => r.ingredient_id && r.quantity > 0),
      }));
    return {
      name: step1Data.name,
      category: step1Data.category,
      description: step1Data.description,
      image_url: imageUrl,
      product_type: step1Data.product_type,
      variants: cleanVariants,
    };
  },
};
