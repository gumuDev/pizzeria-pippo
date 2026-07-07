"use client";

import { useState, useEffect, useCallback } from "react";
import { Form } from "antd";
import { mutate } from "swr";
import {
  getIngredients,
  getBranches,
  getResaleVariants,
  fetchWarehouseStock,
  getWarehouseProductStock,
  transferWarehouseStock,
  transferWarehouseProductStock,
} from "../services/warehouse-stock.service";
import type { TransferType } from "../types/warehouse.types";

interface Ingredient { id: string; name: string; unit: string; }
interface Branch { id: string; name: string; }
interface ProductVariant { id: string; name: string; products: { name: string } | null; }
interface WarehouseIngredientStock { ingredient_id: string; quantity: number; unit: string; }
interface WarehouseProductStock { variant_id: string; quantity: number; }

function isRelevantCacheKey(key: unknown): boolean {
  return (
    (Array.isArray(key) && typeof key[0] === "string" && (key[0].startsWith("stock") || key[0].startsWith("warehouse-")))
  );
}

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
    const [ings, brs, stockData, loadedVariants, loadedProductStock] = await Promise.all([
      getIngredients(),
      getBranches(),
      fetchWarehouseStock({ page: 1, pageSize: 500 }),
      getResaleVariants(),
      getWarehouseProductStock(),
    ]);

    setIngredients(ings);
    setBranches(brs);

    const stockRows: WarehouseIngredientStock[] = stockData.rows.map((r) => ({
      ingredient_id: r.ingredient_id,
      quantity: r.quantity,
      unit: r.unit,
    }));
    setWarehouseIngredientStock(stockRows);
    setVariants(loadedVariants);
    setWarehouseProductStock(loadedProductStock.map((r) => ({ variant_id: r.variant_id, quantity: r.quantity })));

    if (preselectedIngredient) {
      form.setFieldValue("ingredient_id", preselectedIngredient);
      const stockRow = stockRows.find((s) => s.ingredient_id === preselectedIngredient);
      if (stockRow) { setAvailable(stockRow.quantity); setSelectedUnit(stockRow.unit); }
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
    const result = transferType === "ingredient"
      ? await transferWarehouseStock(values as { ingredient_id: string; quantity: number; branch_id: string; notes?: string })
      : await transferWarehouseProductStock(values as { variant_id: string; quantity: number; branch_id: string; notes?: string });
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Error al transferir");
      if (result.available != null) setAvailable(result.available);
      return;
    }
    // Invalida el caché de SWR de /stock (useStock.ts) y de la tabla de bodega
    // central (useWarehouse.ts) — la transferencia modifica branch_stock/
    // branch_product_stock Y warehouse_stock/warehouse_product_stock, y ninguna
    // de esas páginas se entera sola.
    mutate(isRelevantCacheKey);

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
