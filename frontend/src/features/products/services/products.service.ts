import { supabase } from "@/lib/supabase";
import { ok, fail, type ServiceResult } from "@/lib/errors";
import type { Product, Ingredient, Branch, Variant, Step1Data } from "../types/product.types";

export const ProductsService = {
  async getProducts(showInactive: boolean): Promise<Product[]> {
    let query = supabase
      .from("products")
      .select("*, product_variants(id, name, base_price, is_active)")
      .order("name");
    if (!showInactive) query = query.eq("is_active", true);
    const { data } = await query;
    const result = (data ?? []).map((p) => ({
      ...p,
      product_variants: (p.product_variants ?? []).filter((v: { is_active: boolean }) => v.is_active),
    }));
    return result;
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

  async getProductDetail(id: string) {
    const { data } = await supabase
      .from("products")
      .select("*, product_variants(*, branch_prices(*, branches(name)), recipes(*, ingredients(name, unit)))")
      .eq("id", id)
      .single();
    return data ?? null;
  },

  async getVariantsWithDetails(productId: string) {
    const { data } = await supabase
      .from("product_variants")
      .select("*, branch_prices(*), recipes(ingredient_id, quantity, apply_condition)")
      .eq("product_id", productId);
    return data ?? [];
  },

  async createProduct(payload: unknown, token: string): Promise<ServiceResult> {
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
