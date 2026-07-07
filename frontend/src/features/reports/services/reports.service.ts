import { nestFetch } from "@/lib/nestFetch";
import { BranchesService } from "@/features/branches/services/branches.service";
import type { Branch, SalesSummary, TopProduct, DailyData, StockAlert, CashierReport, Order } from "../types/reports.types";

export const ReportsService = {
  async getBranches(): Promise<Branch[]> {
    return BranchesService.getBranches();
  },

  buildParams(selectedBranch: string, from: string, to: string): string {
    const params = new URLSearchParams();
    if (selectedBranch !== "all") params.set("branchId", selectedBranch);
    params.set("from", from);
    params.set("to", to);
    return params.toString();
  },

  async fetchSalesReports(params: string, selectedBranch: string): Promise<{
    summary: SalesSummary | null;
    topProducts: TopProduct[];
    dailyData: DailyData[];
    stockAlerts: StockAlert[];
  }> {
    const alertParams = selectedBranch !== "all" ? `?branchId=${selectedBranch}` : "";

    const [salesRes, topRes, dailyRes, alertsRes] = await Promise.all([
      nestFetch(`/reports/sales?${params}`),
      nestFetch(`/reports/top-products?${params}`),
      nestFetch(`/reports/daily?${params}`),
      nestFetch(`/stock/alerts${alertParams}`),
    ]);

    const [salesData, topData, dailyRaw, alertsData] = await Promise.all([
      salesRes.json(), topRes.json(), dailyRes.json(), alertsRes.json(),
    ]);

    return {
      summary: salesData && !salesData.error ? salesData : null,
      topProducts: Array.isArray(topData) ? topData : [],
      dailyData: Array.isArray(dailyRaw) ? dailyRaw : [],
      stockAlerts: Array.isArray(alertsData) ? alertsData : [],
    };
  },

  async fetchCashierReports(params: string): Promise<CashierReport[]> {
    const res = await nestFetch(`/reports/cashiers?${params}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async fetchOrders(params: string, page: number, pageSize: number): Promise<{ data: Order[]; total: number }> {
    const res = await nestFetch(`/reports/orders?${params}&page=${page}&pageSize=${pageSize}`);
    const data = await res.json();
    if (data && !data.error) return { data: data.data ?? [], total: data.total ?? 0 };
    return { data: [], total: 0 };
  },

  async cancelOrder(orderId: string, reason: string): Promise<{ ok: boolean; error?: string }> {
    const res = await nestFetch(`/orders/${orderId}/cancel`, { method: "POST", body: JSON.stringify({ reason }) });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error ?? "Error al anular la orden" };
  },

  async fetchAllOrdersForExport(params: string): Promise<Order[]> {
    const res = await nestFetch(`/reports/orders?${params}&page=1&pageSize=9999`);
    const data = await res.json();
    if (data && !data.error) return data.data ?? [];
    return [];
  },
};
