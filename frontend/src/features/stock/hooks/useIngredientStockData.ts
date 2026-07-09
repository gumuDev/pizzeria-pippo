"use client";

import useSWR from "swr";
import { StockService } from "../services/stock.service";

const REVALIDATE_INTERVAL = 60 * 1000;
const swrOpts = { revalidateOnFocus: false, dedupingInterval: REVALIDATE_INTERVAL, keepPreviousData: true };

// La tabla de "Stock actual" unificada (insumos + reventa) pagina del lado
// del cliente sobre la lista completa — traer todo de una vez es más simple
// que combinar dos fuentes paginadas por el servidor, y el volumen de stock
// de una sucursal (insumos + productos de reventa) nunca justifica lo otro.
const STOCK_FETCH_SIZE = 9999;

export function useIngredientStockData(selectedBranch: string, pageHistory: number, pageSize: number) {
  const { data: stockData, isLoading: loadingStock, mutate: mutateStock } = useSWR(
    selectedBranch ? (["stock", selectedBranch] as const) : null,
    ([, branchId]) => StockService.getStock({ branchId, page: 1, pageSize: STOCK_FETCH_SIZE }),
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
    movements: movementsData?.data ?? [],
    totalMovements: movementsData?.total ?? 0,
    loadingStock,
    loadingMovements,
    refreshStock: () => { mutateStock(); },
    refreshMovements: () => { mutateMovements(); },
  };
}
