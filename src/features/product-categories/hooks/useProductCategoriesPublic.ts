"use client";

import useSWR, { mutate } from "swr";
import type { ProductCategory } from "../types/product-category.types";

const SWR_KEY = "/api/product-categories/public";

async function fetcher(url: string): Promise<ProductCategory[]> {
  const { supabase } = await import("@/lib/supabase");
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token ?? "";
  const endpoint = token
    ? "/api/product-categories"
    : "/api/product-categories/public";
  const res = await fetch(endpoint, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
  if (!res.ok) throw new Error("Error cargando categorías");
  return res.json();
}

export function invalidatePublicCategoriesCache() {
  mutate(SWR_KEY);
}

export function useProductCategoriesPublic() {
  const { data, isLoading } = useSWR<ProductCategory[]>(SWR_KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const categories = data ?? [];

  const getCategoryNames = (): string[] => categories.map((c) => c.name);
  const categoryAllowsMixing = (name: string): boolean =>
    categories.find((c) => c.name === name)?.allow_mixing ?? false;

  return { categories, loading: isLoading, getCategoryNames, categoryAllowsMixing };
}
