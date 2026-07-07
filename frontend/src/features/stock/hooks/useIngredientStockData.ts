"use client";

import useSWR from "swr";
import { StockService } from "../services/stock.service";

const REVALIDATE_INTERVAL = 60 * 1000;
const swrOpts = { revalidateOnFocus: false, dedupingInterval: REVALIDATE_INTERVAL, keepPreviousData: true };

export function useIngredientStockData(selectedBranch: string, pageStock: number, pageHistory: number, pageSize: number) {
  const { data: stockData, isLoading: loadingStock, mutate: mutateStock } = useSWR(
    selectedBranch ? (["stock", selectedBranch, pageStock] as const) : null,
    ([, branchId, page]) => StockService.getStock({ branchId, page, pageSize }),
    swrOpts,
  );

  const { data: alertsData, mutate: mutateAlerts } = useSWR(
    selectedBranch ? (["stock-alerts", selectedBranch] as const) : null,
    ([, branchId]) => StockService.getAlerts(branchId).then((data) => ({ data, total: data.length })),
    swrOpts,
  );

  const { data: movementsData, isLoading: loadingMovements, mutate: mutateMovements } = useSWR(
    selectedBranch ? (["stock-movements", selectedBranch, pageHistory] as const) : null,
    ([, branchId, page]) => StockService.getMovements({ branchId, page, pageSize }),
    swrOpts,
  );

  return {
    stock: stockData?.data ?? [],
    totalStock: stockData?.total ?? 0,
    alerts: alertsData?.data ?? [],
    movements: movementsData?.data ?? [],
    totalMovements: movementsData?.total ?? 0,
    loadingStock,
    loadingMovements,
    refreshStock: () => { mutateStock(); mutateAlerts(); },
    refreshMovements: () => { mutateMovements(); },
  };
}
