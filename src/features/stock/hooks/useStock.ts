"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Form } from "antd";
import { StockService } from "../services/stock.service";
import type { Branch, Ingredient, StockRow, Movement } from "../types/stock.types";

const PAGE_SIZE = 10;
const REVALIDATE_INTERVAL = 60 * 1000;

async function fetcher<T>(url: string): Promise<{ data: T[]; total: number }> {
  const { supabase } = await import("@/lib/supabase");
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token ?? "";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  if (json.data && Array.isArray(json.data)) return { data: json.data, total: json.total ?? 0 };
  return { data: Array.isArray(json) ? json : [], total: 0 };
}

export function useStock() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [pageStock, setPageStock] = useState(1);
  const [pageMovements, setPageMovements] = useState(1);
  const [minQtyOpen, setMinQtyOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockRow | null>(null);
  const [purchaseIngredientIsNew, setPurchaseIngredientIsNew] = useState(false);

  const [purchaseForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const [minQtyForm] = Form.useForm();

  useEffect(() => {
    Promise.all([StockService.getBranches(), StockService.getIngredients()]).then(([b, i]) => {
      setBranches(b);
      setIngredients(i);
      if (b.length) setSelectedBranch((prev) => prev || b[0].id);
    });
  }, []);

  const swrOpts = { revalidateOnFocus: true, dedupingInterval: REVALIDATE_INTERVAL, keepPreviousData: true };

  const stockKey = selectedBranch
    ? `/api/stock?branchId=${selectedBranch}&page=${pageStock}&pageSize=${PAGE_SIZE}`
    : null;

  const movementsKey = selectedBranch
    ? `/api/stock/movements?branchId=${selectedBranch}&page=${pageMovements}&pageSize=${PAGE_SIZE}`
    : null;

  const { data: stockData, isLoading: loadingStock, mutate: mutateStock } =
    useSWR(stockKey, fetcher<StockRow>, swrOpts);

  const { data: alertsData, mutate: mutateAlerts } =
    useSWR(selectedBranch ? `/api/stock/alerts?branchId=${selectedBranch}` : null, fetcher<StockRow>, swrOpts);

  const { data: movementsData, isLoading: loadingMovements, mutate: mutateMovements } =
    useSWR(movementsKey, fetcher<Movement>, swrOpts);

  const stock = stockData?.data ?? [];
  const totalStock = stockData?.total ?? 0;
  const alerts = alertsData?.data ?? [];
  const movements = movementsData?.data ?? [];
  const totalMovements = movementsData?.total ?? 0;
  const loading = loadingStock || loadingMovements;

  const refreshAll = () => { mutateStock(); mutateAlerts(); mutateMovements(); };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    setPageStock(1);
    setPageMovements(1);
  };

  const resetStockPage = () => setPageStock(1);
  const resetMovementsPage = () => setPageMovements(1);

  const handlePurchaseIngredientChange = (ingredientId: string) => {
    const isNew = !stock.some((s) => s.ingredient_id === ingredientId);
    setPurchaseIngredientIsNew(isNew);
    if (!isNew) purchaseForm.setFieldValue("min_quantity", undefined);
  };

  const handlePurchase = async (values: { ingredient_id: string; quantity: number; min_quantity?: number }) => {
    const ok = await StockService.purchase({ branch_id: selectedBranch, ...values });
    if (ok) { purchaseForm.resetFields(); setPurchaseIngredientIsNew(false); resetStockPage(); refreshAll(); }
  };

  const handleAdjust = async (values: { ingredient_id: string; real_quantity: number; notes?: string }) => {
    const ok = await StockService.adjust({ branch_id: selectedBranch, ...values });
    if (ok) { adjustForm.resetFields(); resetStockPage(); resetMovementsPage(); refreshAll(); }
  };

  const openMinQty = (record: StockRow) => {
    setEditingStock(record);
    minQtyForm.setFieldsValue({ min_quantity: record.min_quantity });
    setMinQtyOpen(true);
  };

  const handleMinQty = async (values: { min_quantity: number }) => {
    if (!editingStock) return;
    const ok = await StockService.updateMinQuantity(editingStock.id, values.min_quantity);
    if (ok) { setMinQtyOpen(false); resetStockPage(); refreshAll(); }
  };

  return {
    branches, ingredients, stock, totalStock, movements, totalMovements, alerts,
    selectedBranch, setSelectedBranch: handleBranchChange,
    pageStock, setPageStock, resetStockPage,
    pageMovements, setPageMovements, resetMovementsPage,
    PAGE_SIZE,
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
