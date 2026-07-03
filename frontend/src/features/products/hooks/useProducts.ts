"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { notification } from "antd";
import { getToken } from "@/lib/auth";
import { ProductsService } from "../services/products.service";
import type { Product, Branch } from "../types/product.types";

const PAGE_SIZE = 10;
const DEDUP_INTERVAL = 60 * 1000;

async function fetchProducts(url: string): Promise<{ data: Product[]; total: number }> {
  const token = await getToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  return { data: json.data ?? [], total: json.total ?? 0 };
}

export function useProducts() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    ProductsService.getBranches().then(setBranches);
  }, []);

  const swrKey = `/api/products?showInactive=${showInactive}&page=${page}&pageSize=${PAGE_SIZE}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}${filterCategory ? `&category=${filterCategory}` : ""}`;

  const { data, isLoading: loading, mutate } = useSWR(swrKey, fetchProducts, {
    revalidateOnFocus: false,
    dedupingInterval: DEDUP_INTERVAL,
    keepPreviousData: true,
  });

  const products = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleToggleActive = async (product: Product) => {
    const token = await getToken();
    const { ok, error } = await ProductsService.patchProduct(product.id, { is_active: !product.is_active }, token);
    if (ok) {
      mutate();
      notification.success({ message: product.is_active ? "Producto desactivado" : "Producto reactivado" });
    } else {
      notification.error({ message: error ?? "Error al actualizar" });
    }
  };

  const handleShowInactive = (val: boolean) => { setShowInactive(val); setPage(1); };
  const handleCategoryFilter = (val: string | null) => { setFilterCategory(val); setPage(1); };

  return {
    products,
    total,
    page,
    PAGE_SIZE,
    setPage,
    branches,
    loading,
    showInactive,
    setShowInactive: handleShowInactive,
    filterCategory,
    setFilterCategory: handleCategoryFilter,
    search,
    setSearch,
    handleToggleActive,
    mutate,
  };
}
