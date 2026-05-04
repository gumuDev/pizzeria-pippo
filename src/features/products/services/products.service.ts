import { supabase } from "@/lib/supabase";
import { ok, fail, type ServiceResult } from "@/lib/errors";
import type { Product, Ingredient, Branch, Variant } from "../types/product.types";

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

  async getVariantsWithDetails(productId: string) {
    const { data } = await supabase
      .from("product_variants")
      .select("*, branch_prices(*), recipes(*)")
      .eq("product_id", productId)
      .eq("is_active", true);
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

  buildPayload(
    step1Data: { name: string; category: string; description: string; branch_id: string },
    imageUrl: string,
    selectedBranchId: string,
    variants: Variant[]
  ) {
    const variantsWithBranch = variants.map((v) => {
      if (!selectedBranchId) return v;
      const alreadyHas = v.branch_prices.some((bp) => bp.branch_id === selectedBranchId);
      const withBranch = alreadyHas ? v : { ...v, branch_prices: [...v.branch_prices, { branch_id: selectedBranchId, price: v.base_price }] };
      // Filter out incomplete recipe rows before sending to API
      return { ...withBranch, recipes: withBranch.recipes.filter((r) => r.ingredient_id && r.quantity > 0) };
    });
    return {
      name: step1Data.name,
      category: step1Data.category,
      description: step1Data.description,
      image_url: imageUrl,
      branch_id: selectedBranchId,
      variants: variantsWithBranch,
    };
  },
};
