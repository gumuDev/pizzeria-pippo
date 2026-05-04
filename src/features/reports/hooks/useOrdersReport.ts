"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { UTC_OFFSET_HOURS } from "@/lib/timezone";
import { ReportsService } from "../services/reports.service";
import type { Order } from "../types/reports.types";

export function useOrdersReport() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetch = useCallback(async (params: string, page = 1, pageSize = 10) => {
    setLoading(true);
    const token = await ReportsService.getToken();
    const result = await ReportsService.fetchOrders(params, page, pageSize, token);
    setOrders(result.data);
    setOrdersTotal(result.total);
    setLoading(false);
  }, []);

  const exportToExcel = useCallback(async (params: string) => {
    setExporting(true);
    const token = await ReportsService.getToken();
    const allOrders = await ReportsService.fetchAllOrdersForExport(params, token);
    setExporting(false);

    const rows = allOrders.flatMap((order) =>
      order.order_items.map((item) => ({
        Fecha: dayjs(order.created_at).add(UTC_OFFSET_HOURS, "hour").format("DD/MM/YYYY HH:mm"),
        Sucursal: order.branches?.name ?? "—",
        Cajero: order.cashier_name,
        Tipo: order.order_type === "takeaway" ? "Para llevar" : "Comer aquí",
        Pago: order.payment_method === "efectivo" ? "Efectivo" : order.payment_method === "qr" ? "QR" : "—",
        Producto: item.product_variants?.products?.name ?? "—",
        Variante: item.product_variants?.name ?? "—",
        Cantidad: item.qty,
        "Precio unitario": Number(item.unit_price).toFixed(2),
        Descuento: Number(item.discount_applied).toFixed(2),
        "Total venta": Number(order.total).toFixed(2),
      }))
    );

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial de ventas");
    XLSX.writeFile(wb, `ventas_${dayjs().format("YYYY-MM-DD")}.xlsx`);
  }, []);

  return { orders, ordersTotal, ordersPage, setOrdersPage, ordersPageSize, setOrdersPageSize, loading, exporting, fetch, exportToExcel };
}
