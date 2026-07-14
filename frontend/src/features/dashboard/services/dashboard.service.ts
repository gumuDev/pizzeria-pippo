import dayjs from "dayjs";
import { nestFetch } from "@/lib/nestFetch";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { todayInBolivia, yesterdayInBolivia } from "@/lib/timezone";
import type { SalesSummary, TopProduct, WarehouseAlert, DashboardData } from "../types/dashboard.types";

async function fetchDaySummary(date: string): Promise<{ summary: SalesSummary | null; topProducts: TopProduct[] }> {
  const [salesRes, topRes] = await Promise.all([
    nestFetch(API_ENDPOINTS.reports.sales(`from=${date}&to=${date}`)),
    nestFetch(API_ENDPOINTS.reports.topProducts(`from=${date}&to=${date}`)),
  ]);
  const [salesData, topData] = await Promise.all([salesRes.json(), topRes.json()]);

  return {
    summary: salesData && !salesData.error ? salesData : null,
    topProducts: Array.isArray(topData) ? topData.slice(0, 5) : [],
  };
}

export const DashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const today = todayInBolivia();
    const weekStart = dayjs(today).subtract(6, "day").format("YYYY-MM-DD");

    const [todayResult, dailyRes, alertsRes, warehouseStockRes] = await Promise.all([
      fetchDaySummary(today),
      nestFetch(API_ENDPOINTS.reports.daily(`from=${weekStart}&to=${today}`)),
      nestFetch(API_ENDPOINTS.stock.alerts()),
      nestFetch(API_ENDPOINTS.warehouse.stockLow()),
    ]);

    const [dailyRaw, alertsData, warehouseJson] = await Promise.all([
      dailyRes.json(), alertsRes.json(), warehouseStockRes.json(),
    ]);

    // The warehouse endpoint responds with { data, total, page, pageSize }, not a bare
    // array — reading it directly always evaluated to "not an array", so warehouse
    // alerts on the dashboard were silently empty regardless of real stock levels.
    const warehouseRows: WarehouseAlert[] = Array.isArray(warehouseJson?.data) ? warehouseJson.data : [];

    // Sin ventas todavía hoy (ej. temprano en la mañana) — un segundo fetch,
    // solo en este caso, para no duplicar requests en el caso común.
    const hasSalesToday = (todayResult.summary?.count ?? 0) > 0;
    const summaryDate = hasSalesToday ? today : yesterdayInBolivia();
    const dayResult = hasSalesToday ? todayResult : await fetchDaySummary(summaryDate);

    return {
      summary: dayResult.summary,
      topProducts: dayResult.topProducts,
      summaryDate,
      showingYesterday: !hasSalesToday,
      dailyData: Array.isArray(dailyRaw) ? dailyRaw : [],
      stockAlerts: Array.isArray(alertsData) ? alertsData : [],
      warehouseAlerts: warehouseRows.filter((w) => w.quantity < w.min_quantity),
    };
  },
};
