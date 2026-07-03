import dayjs from "dayjs";

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
  async getDashboardData(token: string): Promise<DashboardData> {
    const headers = { Authorization: `Bearer ${token}` };
    const today = dayjs().format("YYYY-MM-DD");
    const weekStart = dayjs().subtract(6, "day").format("YYYY-MM-DD");

    const [salesRes, topRes, dailyRes, alertsRes, warehouseStockRes] = await Promise.all([
      fetch(`/api/reports/sales?from=${today}&to=${today}`, { headers }),
      fetch(`/api/reports/top-products?from=${today}&to=${today}`, { headers }),
      fetch(`/api/reports/daily?from=${weekStart}&to=${today}`, { headers }),
      fetch(`/api/stock/alerts`, { headers }),
      fetch(`/api/warehouse/stock`, { headers }),
    ]);

    const [salesData, topData, dailyRaw, alertsData, warehouseData] = await Promise.all([
      salesRes.json(), topRes.json(), dailyRes.json(), alertsRes.json(), warehouseStockRes.json(),
    ]);

    return {
      summary: salesData && !salesData.error ? salesData : null,
      topProducts: Array.isArray(topData) ? topData.slice(0, 5) : [],
      dailyData: Array.isArray(dailyRaw) ? dailyRaw : [],
      stockAlerts: Array.isArray(alertsData) ? alertsData : [],
      warehouseAlerts: Array.isArray(warehouseData)
        ? warehouseData.filter((w: WarehouseAlert) => w.quantity < w.min_quantity)
        : [],
    };
  },
};
