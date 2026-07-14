"use client";

import { useState, useEffect, useCallback } from "react";
import { Form, message } from "antd";
import { getWarehouseProductStock, adjustWarehouseProductStock } from "../services/warehouse-product-stock.service";
import type { ProductStockRow } from "../types/warehouse.types";

export function useWarehouseProductTable() {
  const [rows, setRows] = useState<ProductStockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjustingRow, setAdjustingRow] = useState<ProductStockRow | null>(null);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getWarehouseProductStock();
    setRows(data as ProductStockRow[]);
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
    const result = await adjustWarehouseProductStock({
      variant_id: adjustingRow.variant_id,
      real_quantity: values.real_quantity,
      notes: values.notes,
    });
    setAdjustLoading(false);
    if (!result.ok) {
      message.error(result.error ?? "Error al ajustar");
      return;
    }
    message.success("Stock ajustado correctamente");
    closeAdjust();
    load();
  };

  const alertCount = rows.filter((r) => r.quantity < r.min_quantity).length;

  return { rows, loading, adjustingRow, adjustLoading, adjustForm, alertCount, openAdjust, closeAdjust, handleAdjust };
}
