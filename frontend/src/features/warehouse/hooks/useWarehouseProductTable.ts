"use client";

import { useState, useEffect, useCallback } from "react";
import { Form, message } from "antd";
import { getToken } from "@/lib/auth";

export interface ProductStockRow {
  id: string;
  variant_id: string;
  quantity: number;
  min_quantity: number;
  product_variants: {
    id: string;
    name: string;
    products: { id: string; name: string; is_active: boolean } | null;
  } | null;
}

export function useWarehouseProductTable() {
  const [rows, setRows] = useState<ProductStockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjustingRow, setAdjustingRow] = useState<ProductStockRow | null>(null);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    const res = await fetch("/api/warehouse/product-stock", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setRows(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdjust = (row: ProductStockRow) => {
    setAdjustingRow(row);
    adjustForm.setFieldsValue({ real_quantity: row.quantity, notes: "" });
  };

  const closeAdjust = () => {
    setAdjustingRow(null);
    adjustForm.resetFields();
  };

  const handleAdjust = async (values: { real_quantity: number; notes: string }) => {
    if (!adjustingRow) return;
    setAdjustLoading(true);
    const token = await getToken();
    const res = await fetch("/api/warehouse/product-adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ variant_id: adjustingRow.variant_id, real_quantity: values.real_quantity, notes: values.notes }),
    });
    setAdjustLoading(false);
    if (!res.ok) {
      const json = await res.json();
      message.error(json.error ?? "Error al ajustar");
      return;
    }
    message.success("Stock ajustado correctamente");
    closeAdjust();
    load();
  };

  const alertCount = rows.filter((r) => r.quantity < r.min_quantity).length;

  return { rows, loading, adjustingRow, adjustLoading, adjustForm, alertCount, openAdjust, closeAdjust, handleAdjust };
}
