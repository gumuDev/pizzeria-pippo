"use client";

import { useState, useCallback } from "react";
import { ReportsService } from "../services/reports.service";
import type { Order } from "../types/reports.types";

export function useOrdersReport() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (params: string, page = 1) => {
    setLoading(true);
    const token = await ReportsService.getToken();
    const result = await ReportsService.fetchOrders(params, page, token);
    setOrders(result.data);
    setOrdersTotal(result.total);
    setLoading(false);
  }, []);

  return { orders, ordersTotal, ordersPage, setOrdersPage, loading, fetch };
}
