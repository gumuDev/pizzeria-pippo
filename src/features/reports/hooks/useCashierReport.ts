"use client";

import { useState, useCallback } from "react";
import { ReportsService } from "../services/reports.service";
import type { CashierReport } from "../types/reports.types";

export function useCashierReport() {
  const [cashierReports, setCashierReports] = useState<CashierReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (params: string) => {
    setLoading(true);
    const token = await ReportsService.getToken();
    const data = await ReportsService.fetchCashierReports(params, token);
    setCashierReports(data);
    setLoading(false);
  }, []);

  return { cashierReports, loading, fetch };
}
