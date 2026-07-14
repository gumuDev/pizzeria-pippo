"use client";

import useSWR from "swr";
import { StockService } from "../services/stock.service";
import type { ProductVariantOption } from "../types/stock.types";

const REVALIDATE_INTERVAL = 60 * 1000;
const swrOpts = { revalidateOnFocus: false, dedupingInterval: REVALIDATE_INTERVAL, keepPreviousData: true };
const swrFresh = { ...swrOpts, keepPreviousData: false };

export function useProductStockData(selectedBranch: string, pageHistory: number, pageSize: number) {
  const { data: productStockData, isLoading: loadingProductStock, mutate: mutateProductStock } = useSWR(
    selectedBranch ? (["stock-product-stock", selectedBranch] as const) : null,
    ([, branchId]) => StockService.getProductStock(branchId).then((data) => ({ data, total: data.length })),
    swrFresh,
  );

  const { data: movementsData, isLoading: loadingMovements, mutate: mutateMovements } = useSWR(
    selectedBranch ? (["stock-product-movements", selectedBranch, pageHistory] as const) : null,
    ([, branchId, page]) => StockService.getProductMovements({ branchId, page, pageSize }),
    swrOpts,
  );

  const { data: resaleVariantsData } = useSWR(
    "stock-resale-variants",
    () => StockService.getResaleVariants().then((data) => ({ data, total: data.length })),
    swrOpts,
  );

  const productVariants: ProductVariantOption[] = (resaleVariantsData?.data ?? []).map((r) => ({
    variantId: r.id,
    productName: (r.products as { name: string } | null)?.name ?? "—",
    variantName: r.name,
  }));

  return {
    productStock: loadingProductStock ? [] : (productStockData?.data ?? []),
    loadingProductStock,
    movements: movementsData?.data ?? [],
    totalMovements: movementsData?.total ?? 0,
    loadingMovements,
    productVariants,
    refreshProductStock: () => { mutateProductStock(); },
    refreshMovements: () => { mutateMovements(); },
  };
}
