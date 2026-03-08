"use client";

import { useState, useEffect, useCallback } from "react";
import { Form } from "antd";
import { StockService } from "../services/stock.service";
import type { Branch, Ingredient, StockRow, Movement } from "../types/stock.types";

export function useStock() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [alerts, setAlerts] = useState<StockRow[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [minQtyOpen, setMinQtyOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockRow | null>(null);
  const [purchaseIngredientIsNew, setPurchaseIngredientIsNew] = useState(false);

  const [purchaseForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const [minQtyForm] = Form.useForm();

  const fetchBranchesAndIngredients = useCallback(async () => {
    setLoading(true);
    const [b, i] = await Promise.all([
      StockService.getBranches(),
      StockService.getIngredients(),
    ]);
    setBranches(b);
    setIngredients(i);
    if (b.length) setSelectedBranch((prev) => prev || b[0].id);
    setLoading(false);
  }, []);

  const fetchStock = useCallback(async (branchId: string) => {
    if (!branchId) return;
    setLoading(true);
    const [s, a, m] = await Promise.all([
      StockService.getStock(branchId),
      StockService.getAlerts(branchId),
      StockService.getMovements(branchId),
    ]);
    setStock(s);
    setAlerts(a);
    setMovements(m);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBranchesAndIngredients(); }, [fetchBranchesAndIngredients]);
  useEffect(() => { if (selectedBranch) fetchStock(selectedBranch); }, [selectedBranch, fetchStock]);

  const handlePurchaseIngredientChange = (ingredientId: string) => {
    const isNew = !stock.some((s) => s.ingredient_id === ingredientId);
    setPurchaseIngredientIsNew(isNew);
    if (!isNew) purchaseForm.setFieldValue("min_quantity", undefined);
  };

  const handlePurchase = async (values: { ingredient_id: string; quantity: number; min_quantity?: number }) => {
    const ok = await StockService.purchase({ branch_id: selectedBranch, ...values });
    if (ok) { purchaseForm.resetFields(); setPurchaseIngredientIsNew(false); fetchStock(selectedBranch); }
  };

  const handleAdjust = async (values: { ingredient_id: string; real_quantity: number; notes?: string }) => {
    const ok = await StockService.adjust({ branch_id: selectedBranch, ...values });
    if (ok) { adjustForm.resetFields(); fetchStock(selectedBranch); }
  };

  const openMinQty = (record: StockRow) => {
    setEditingStock(record);
    minQtyForm.setFieldsValue({ min_quantity: record.min_quantity });
    setMinQtyOpen(true);
  };

  const handleMinQty = async (values: { min_quantity: number }) => {
    if (!editingStock) return;
    const ok = await StockService.updateMinQuantity(editingStock.id, values.min_quantity);
    if (ok) { setMinQtyOpen(false); fetchStock(selectedBranch); }
  };

  return {
    branches, ingredients, stock, movements, alerts,
    selectedBranch, setSelectedBranch,
    loading,
    minQtyOpen, setMinQtyOpen,
    editingStock,
    purchaseIngredientIsNew,
    purchaseForm, adjustForm, minQtyForm,
    handlePurchaseIngredientChange,
    handlePurchase, handleAdjust,
    openMinQty, handleMinQty,
  };
}
