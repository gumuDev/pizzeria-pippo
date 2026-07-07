"use client";

import { useEffect } from "react";
import { useReportFilters } from "./useReportFilters";
import { useSalesReport } from "./useSalesReport";
import { useCashierReport } from "./useCashierReport";
import { useOrdersReport } from "./useOrdersReport";
import { useOrderCancellation } from "./useOrderCancellation";

export function useReportsPage() {
  const filters = useReportFilters();
  const sales = useSalesReport();
  const cashier = useCashierReport();
  const ordersReport = useOrdersReport();
  const cancellation = useOrderCancellation(() => ordersReport.fetch(filters.buildParams(), ordersReport.ordersPage));

  const { buildParams, selectedBranch, activeTab } = filters;

  useEffect(() => {
    const params = buildParams();
    if (activeTab === "general") sales.fetch(params, selectedBranch);
    if (activeTab === "cajeros") cashier.fetch(params);
    if (activeTab === "ventas") { ordersReport.setOrdersPage(1); ordersReport.fetch(params, 1); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedBranch, filters.dateRange]);

  return { filters, sales, cashier, ordersReport, cancellation };
}
