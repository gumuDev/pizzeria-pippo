"use client";

import { useState, useCallback } from "react";
import { ReportsService } from "../services/reports.service";
import type { SalesSummary, TopProduct, DailyData, StockAlert } from "../types/reports.types";

export function useSalesReport() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (params: string, selectedBranch: string) => {
    setLoading(true);
    const token = await ReportsService.getToken();
    const result = await ReportsService.fetchSalesReports(params, selectedBranch, token);
    setSummary(result.summary);
    setTopProducts(result.topProducts);
    setDailyData(result.dailyData);
    setStockAlerts(result.stockAlerts);
    setLoading(false);
  }, []);

  return { summary, topProducts, dailyData, stockAlerts, loading, fetch };
}
