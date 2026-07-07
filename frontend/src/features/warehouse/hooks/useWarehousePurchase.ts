"use client";

import { useState, useEffect } from "react";
import { Form } from "antd";
import { mutate } from "swr";
import { getIngredients, fetchWarehouseStock, purchaseWarehouseStock } from "../services/warehouse-ingredient-stock.service";
import { getResaleVariants, getWarehouseProductStock, purchaseWarehouseProductStock } from "../services/warehouse-product-stock.service";
import type { PurchaseType } from "../types/warehouse.types";

interface Ingredient { id: string; name: string; unit: string; }
interface ProductVariant { id: string; name: string; products: { name: string } | null; }
interface WarehouseStock { ingredient_id: string; quantity: number; min_quantity: number; }
interface WarehouseProductStock { variant_id: string; quantity: number; min_quantity: number; }

function isWarehouseCacheKey(key: unknown): boolean {
  return Array.isArray(key) && typeof key[0] === "string" && key[0].startsWith("warehouse-");
}

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
      const [ings, varData, stockData, productStockData] = await Promise.all([
        getIngredients(),
        getResaleVariants(),
        fetchWarehouseStock({ page: 1, pageSize: 500 }),
        getWarehouseProductStock(),
      ]);
      setIngredients(ings);
      setVariants(varData);
      setWarehouseStock(stockData.rows.map((r) => ({ ingredient_id: r.ingredient_id, quantity: r.quantity, min_quantity: r.min_quantity })));
      setWarehouseProductStock(productStockData.map((r) => ({ variant_id: r.variant_id, quantity: r.quantity, min_quantity: r.min_quantity })));
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
    const result = purchaseType === "ingredient"
      ? await purchaseWarehouseStock(values as { ingredient_id: string; quantity: number; notes?: string; min_quantity?: number })
      : await purchaseWarehouseProductStock(values as { variant_id: string; quantity: number; notes?: string; min_quantity?: number });
    setLoading(false);
    if (!result.ok) { setError(result.error ?? "Error al registrar compra"); return; }

    // Invalida el caché de SWR de la tabla de bodega central (useWarehouse.ts) —
    // la compra modifica warehouse_stock/warehouse_product_stock pero esa página
    // no se entera sola.
    mutate(isWarehouseCacheKey);

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
