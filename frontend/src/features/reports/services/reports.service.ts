import { getToken } from "@/lib/auth";
import { BranchesService } from "@/features/branches/services/branches.service";
import type { Branch, SalesSummary, TopProduct, DailyData, StockAlert, CashierReport, Order } from "../types/reports.types";

const USE_NEST = process.env.NEXT_PUBLIC_USE_NEST_REPORTS === "true";
const USE_NEST_STOCK = process.env.NEXT_PUBLIC_USE_NEST_STOCK === "true";
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

export const ReportsService = {
  async getToken(): Promise<string> {
    return getToken();
  },

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

  async fetchSalesReports(params: string, selectedBranch: string, token: string): Promise<{
    summary: SalesSummary | null;
    topProducts: TopProduct[];
    dailyData: DailyData[];
    stockAlerts: StockAlert[];
  }> {
    const headers = { Authorization: `Bearer ${token}` };
    const alertParams = selectedBranch !== "all" ? `?branchId=${selectedBranch}` : "";
    const reportsBase = USE_NEST ? `${NEST_API_URL}/reports` : "/api/reports";
    const stockAlertsUrl = USE_NEST_STOCK ? `${NEST_API_URL}/stock/alerts${alertParams}` : `/api/stock/alerts${alertParams}`;

    const [salesRes, topRes, dailyRes, alertsRes] = await Promise.all([
      fetch(`${reportsBase}/sales?${params}`, { headers }),
      fetch(`${reportsBase}/top-products?${params}`, { headers }),
      fetch(`${reportsBase}/daily?${params}`, { headers }),
      fetch(stockAlertsUrl, { headers }),
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

  async fetchCashierReports(params: string, token: string): Promise<CashierReport[]> {
    const url = USE_NEST ? `${NEST_API_URL}/reports/cashiers?${params}` : `/api/reports/cashiers?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async fetchOrders(params: string, page: number, pageSize: number, token: string): Promise<{ data: Order[]; total: number }> {
    const base = USE_NEST ? `${NEST_API_URL}/reports/orders` : "/api/reports/orders";
    const res = await fetch(`${base}?${params}&page=${page}&pageSize=${pageSize}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data && !data.error) return { data: data.data ?? [], total: data.total ?? 0 };
    return { data: [], total: 0 };
  },

  async cancelOrder(orderId: string, reason: string, token: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error ?? "Error al anular la orden" };
  },

  async fetchAllOrdersForExport(params: string, token: string): Promise<Order[]> {
    const base = USE_NEST ? `${NEST_API_URL}/reports/orders` : "/api/reports/orders";
    const res = await fetch(`${base}?${params}&page=1&pageSize=9999`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data && !data.error) return data.data ?? [];
    return [];
  },
};
