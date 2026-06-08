"use client";

import { useState, useEffect, useCallback } from "react";
import { Form } from "antd";
import { getToken } from "@/lib/auth";
import { getIngredients, getBranches } from "../services/warehouse-stock.service";

export type TransferType = "ingredient" | "product";

interface Ingredient { id: string; name: string; unit: string; }
interface Branch { id: string; name: string; }
interface ProductVariant { id: string; name: string; products: { name: string } | null; }
interface WarehouseIngredientStock { ingredient_id: string; quantity: number; ingredients: Ingredient; }
interface WarehouseProductStock { variant_id: string; quantity: number; }

export function useWarehouseTransfer(preselectedIngredient: string | null, preselectedVariant: string | null = null) {
  const [form] = Form.useForm();
  const [transferType, setTransferType] = useState<TransferType>(preselectedVariant ? "product" : "ingredient");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [warehouseIngredientStock, setWarehouseIngredientStock] = useState<WarehouseIngredientStock[]>([]);
  const [warehouseProductStock, setWarehouseProductStock] = useState<WarehouseProductStock[]>([]);
  const [available, setAvailable] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    const [ings, brs, stockRes, varRes, productStockRes] = await Promise.all([
      getIngredients(),
      getBranches(),
      fetch("/api/warehouse/stock?pageSize=500", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/stock/resale-variants", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/warehouse/product-stock", { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    setIngredients(ings);
    setBranches(brs);

    const stockData = await stockRes.json();
    const stockRows: WarehouseIngredientStock[] = stockData.data ?? [];
    setWarehouseIngredientStock(stockRows);

    const varData = await varRes.json();
    const loadedVariants: ProductVariant[] = varData.data ?? [];
    setVariants(loadedVariants);

    const productStockData = await productStockRes.json();
    const loadedProductStock: WarehouseProductStock[] = productStockData.data ?? [];
    setWarehouseProductStock(loadedProductStock);

    if (preselectedIngredient) {
      form.setFieldValue("ingredient_id", preselectedIngredient);
      const stockRow = stockRows.find((s) => s.ingredient_id === preselectedIngredient);
      if (stockRow) { setAvailable(stockRow.quantity); setSelectedUnit(stockRow.ingredients.unit); }
    }

    if (preselectedVariant) {
      form.setFieldValue("variant_id", preselectedVariant);
      const stockRow = loadedProductStock.find((s) => s.variant_id === preselectedVariant);
      setAvailable(stockRow?.quantity ?? 0);
      setSelectedUnit("unidades");
    }
  }, [preselectedIngredient, preselectedVariant, form]);

  useEffect(() => { load(); }, [load]);

  const handleTypeChange = (type: TransferType) => {
    setTransferType(type);
    form.resetFields();
    setAvailable(null);
    setSelectedUnit("");
    setError(null);
  };

  const handleIngredientChange = (id: string) => {
    const stockRow = warehouseIngredientStock.find((s) => s.ingredient_id === id);
    setAvailable(stockRow?.quantity ?? null);
    setSelectedUnit(ingredients.find((i) => i.id === id)?.unit ?? "");
    setError(null);
  };

  const handleVariantChange = (id: string) => {
    const stockRow = warehouseProductStock.find((s) => s.variant_id === id);
    setAvailable(stockRow?.quantity ?? null);
    setSelectedUnit("unidades");
    setError(null);
  };

  const handleSubmit = async (values: Record<string, unknown>, onSuccess: () => void) => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    const url = transferType === "ingredient" ? "/api/warehouse/transfer" : "/api/warehouse/product-transfer";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Error al transferir");
      if (json.available != null) setAvailable(json.available);
      return;
    }
    setSuccess(true);
    form.resetFields();
    setAvailable(null);
    setSelectedUnit("");
    setTimeout(() => { setSuccess(false); onSuccess(); }, 2000);
  };

  return {
    form, transferType, ingredients, branches, variants,
    available, selectedUnit, loading, error, success,
    setError, handleTypeChange, handleIngredientChange, handleVariantChange, handleSubmit,
  };
}
