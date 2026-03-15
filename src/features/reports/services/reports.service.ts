import { supabase } from "@/lib/supabase";
import type { Branch, SalesSummary, TopProduct, DailyData, StockAlert, CashierReport, Order } from "../types/reports.types";

export const ReportsService = {
  async getToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  },

  async getBranches(): Promise<Branch[]> {
    const { data } = await supabase.from("branches").select("*").order("name");
    return data ?? [];
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

    const [salesRes, topRes, dailyRes, alertsRes] = await Promise.all([
      fetch(`/api/reports/sales?${params}`, { headers }),
      fetch(`/api/reports/top-products?${params}`, { headers }),
      fetch(`/api/reports/daily?${params}`, { headers }),
      fetch(`/api/stock/alerts${alertParams}`, { headers }),
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
    const res = await fetch(`/api/reports/cashiers?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async fetchOrders(params: string, page: number, token: string): Promise<{ data: Order[]; total: number }> {
    const res = await fetch(`/api/reports/orders?${params}&page=${page}&pageSize=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data && !data.error) return { data: data.data ?? [], total: data.total ?? 0 };
    return { data: [], total: 0 };
  },

  async fetchAllOrdersForExport(params: string, token: string): Promise<Order[]> {
    const res = await fetch(`/api/reports/orders?${params}&page=1&pageSize=9999`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data && !data.error) return data.data ?? [];
    return [];
  },
};
