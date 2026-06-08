"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";
import { DashboardService } from "../services/dashboard.service";
import type { SalesSummary, TopProduct, DailyData, StockAlert, WarehouseAlert } from "../services/dashboard.service";

export function useDashboard() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [warehouseAlerts, setWarehouseAlerts] = useState<WarehouseAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = await getToken();

      const data = await DashboardService.getDashboardData(token);
      setSummary(data.summary);
      setTopProducts(data.topProducts);
      setDailyData(data.dailyData);
      setStockAlerts(data.stockAlerts);
      setWarehouseAlerts(data.warehouseAlerts);
      setLoading(false);
    };
    load();
  }, []);

  return { summary, topProducts, dailyData, stockAlerts, warehouseAlerts, loading };
}
