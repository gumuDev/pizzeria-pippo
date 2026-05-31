"use client";

import { useState, useEffect } from "react";
import type { ProductCategory } from "../types/product-category.types";
import { getProductCategoriesPublic } from "../services/product-categories.service";

let publicCache: ProductCategory[] | null = null;

export function useProductCategoriesPublic() {
  const [categories, setCategories] = useState<ProductCategory[]>(publicCache ?? []);
  const [loading, setLoading] = useState(!publicCache);

  useEffect(() => {
    if (publicCache) return;
    setLoading(true);
    getProductCategoriesPublic()
      .then((data) => { publicCache = data; setCategories(data); })
      .finally(() => setLoading(false));
  }, []);

  const getCategoryNames = (): string[] => categories.map((c) => c.name);
  const categoryAllowsMixing = (name: string): boolean =>
    categories.find((c) => c.name === name)?.allow_mixing ?? false;

  return { categories, loading, getCategoryNames, categoryAllowsMixing };
}
