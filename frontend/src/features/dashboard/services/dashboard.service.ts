import dayjs from "dayjs";
import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import type { WarehouseAlert, DashboardData } from "../types/dashboard.types";

export const DashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const today = dayjs().format("YYYY-MM-DD");
    const weekStart = dayjs().subtract(6, "day").format("YYYY-MM-DD");

    const [salesRes, topRes, dailyRes, alertsRes, warehouseStockRes] = await Promise.all([
      nestFetch(API_ENDPOINTS.reports.sales(`from=${today}&to=${today}`)),
      nestFetch(API_ENDPOINTS.reports.topProducts(`from=${today}&to=${today}`)),
      nestFetch(API_ENDPOINTS.reports.daily(`from=${weekStart}&to=${today}`)),
      nestFetch(API_ENDPOINTS.stock.alerts()),
      nestFetch(API_ENDPOINTS.warehouse.stockLow()),
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
