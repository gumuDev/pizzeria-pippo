"use client";

import { useState, useEffect } from "react";
import { Form } from "antd";
import { getToken } from "@/lib/auth";
import { getIngredients } from "../services/warehouse-stock.service";

export type PurchaseType = "ingredient" | "product";

interface Ingredient { id: string; name: string; unit: string; }
interface ProductVariant { id: string; name: string; products: { name: string } | null; }
interface WarehouseStock { ingredient_id: string; quantity: number; min_quantity: number; }
interface WarehouseProductStock { variant_id: string; quantity: number; min_quantity: number; }

export function useWarehousePurchase() {
  const [form] = Form.useForm();
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("ingredient");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([]);
  const [warehouseProductStock, setWarehouseProductStock] = useState<WarehouseProductStock[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      const [ings, varRes, stockRes, productStockRes] = await Promise.all([
        getIngredients(),
        fetch("/api/stock/resale-variants", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/warehouse/stock?pageSize=500", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/warehouse/product-stock", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setIngredients(ings);
      const varData = await varRes.json();
      setVariants(varData.data ?? []);
      const stockData = await stockRes.json();
      setWarehouseStock(stockData.data ?? []);
      const productStockData = await productStockRes.json();
      setWarehouseProductStock(productStockData.data ?? []);
    };
    load();
  }, []);

  const handleTypeChange = (type: PurchaseType) => {
    setPurchaseType(type);
    form.resetFields();
    setSelectedUnit("");
    setCurrentStock(null);
    setError(null);
  };

  const handleIngredientChange = (id: string) => {
    const ing = ingredients.find((i) => i.id === id);
    setSelectedUnit(ing?.unit ?? "");
    const stock = warehouseStock.find((s) => s.ingredient_id === id);
    setCurrentStock(stock?.quantity ?? 0);
    form.setFieldValue("min_quantity", stock?.min_quantity ?? 0);
  };

  const handleVariantChange = (id: string) => {
    const stock = warehouseProductStock.find((s) => s.variant_id === id);
    setCurrentStock(stock?.quantity ?? 0);
    form.setFieldValue("min_quantity", stock?.min_quantity ?? 0);
    setSelectedUnit("unidades");
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    const url = purchaseType === "ingredient" ? "/api/warehouse/purchase" : "/api/warehouse/product-purchase";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Error al registrar compra"); return; }
    setSuccess(true);
    form.resetFields();
    setSelectedUnit("");
    setCurrentStock(null);
    setTimeout(() => setSuccess(false), 3000);
  };

  return {
    form, purchaseType, ingredients, variants,
    selectedUnit, currentStock, loading, error, success,
    setError, handleTypeChange, handleIngredientChange, handleVariantChange, handleSubmit,
  };
}
