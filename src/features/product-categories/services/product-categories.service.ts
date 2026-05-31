import type { ProductCategory, ProductCategoryInput } from "../types/product-category.types";

export async function getProductCategories(token: string): Promise<ProductCategory[]> {
  const res = await fetch("/api/product-categories", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error cargando categorías");
  return res.json();
}

export async function getProductCategoriesPublic(): Promise<ProductCategory[]> {
  const res = await fetch("/api/product-categories/public");
  if (!res.ok) throw new Error("Error cargando categorías");
  return res.json();
}

export async function createProductCategory(token: string, input: ProductCategoryInput): Promise<ProductCategory> {
  const res = await fetch("/api/product-categories", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Error creando categoría");
  return res.json();
}

export async function updateProductCategory(token: string, id: string, input: Partial<ProductCategoryInput>): Promise<void> {
  const res = await fetch(`/api/product-categories/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Error actualizando categoría");
}

export async function deleteProductCategory(token: string, id: string): Promise<{ soft: boolean; count?: number }> {
  const res = await fetch(`/api/product-categories/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Error eliminando categoría");
  return res.json();
}
