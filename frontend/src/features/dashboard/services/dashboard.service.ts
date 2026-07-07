import dayjs from "dayjs";
import { nestFetch } from "@/lib/nestFetch";

export interface SalesSummary { total: number; count: number; avg: number; }
export interface TopProduct {
  variant_id: string;
  product_name: string;
  variant_name: string;
  category: string;
  qty: number;
  revenue: number;
}
export interface DailyData { date: string; total: number; }
export interface StockAlert {
  id: string;
  quantity: number;
  min_quantity: number;
  ingredients: { name: string; unit: string };
  branches: { name: string };
}
export interface WarehouseAlert {
  id: string;
  ingredient_id: string;
  quantity: number;
  min_quantity: number;
  ingredients: { name: string; unit: string };
}

export interface DashboardData {
  summary: SalesSummary | null;
  topProducts: TopProduct[];
  dailyData: DailyData[];
  stockAlerts: StockAlert[];
  warehouseAlerts: WarehouseAlert[];
}

export const DashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const today = dayjs().format("YYYY-MM-DD");
    const weekStart = dayjs().subtract(6, "day").format("YYYY-MM-DD");

    const [salesRes, topRes, dailyRes, alertsRes, warehouseStockRes] = await Promise.all([
      nestFetch(`/reports/sales?from=${today}&to=${today}`),
      nestFetch(`/reports/top-products?from=${today}&to=${today}`),
      nestFetch(`/reports/daily?from=${weekStart}&to=${today}`),
      nestFetch("/stock/alerts"),
      nestFetch("/warehouse/stock?status=low&pageSize=9999"),
    ]);

    const [salesData, topData, dailyRaw, alertsData, warehouseJson] = await Promise.all([
      salesRes.json(), topRes.json(), dailyRes.json(), alertsRes.json(), warehouseStockRes.json(),
    ]);

    // The warehouse endpoint responds with { data, total, page, pageSize }, not a bare
    // array — reading it directly always evaluated to "not an array", so warehouse
    // alerts on the dashboard were silently empty regardless of real stock levels.
    const warehouseRows: WarehouseAlert[] = Array.isArray(warehouseJson?.data) ? warehouseJson.data : [];

    return {
      summary: salesData && !salesData.error ? salesData : null,
      topProducts: Array.isArray(topData) ? topData.slice(0, 5) : [],
      dailyData: Array.isArray(dailyRaw) ? dailyRaw : [],
      stockAlerts: Array.isArray(alertsData) ? alertsData : [],
      warehouseAlerts: warehouseRows.filter((w) => w.quantity < w.min_quantity),
    };
  },
};
