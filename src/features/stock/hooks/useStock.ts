"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Form, message } from "antd";
import { StockService } from "../services/stock.service";
import type {
  Branch, Ingredient, StockRow, Movement, ProductStockRow,
  ProductVariantOption, ProductMovement, UnifiedMovement,
} from "../types/stock.types";

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
  const [pageHistory, setPageHistory] = useState(1);
  const [minQtyOpen, setMinQtyOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockRow | null>(null);
  const [purchaseIngredientIsNew, setPurchaseIngredientIsNew] = useState(false);
  const [purchaseVariantIsNew, setPurchaseVariantIsNew] = useState(false);

  const [purchaseForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const [minQtyForm] = Form.useForm();
  const [productPurchaseForm] = Form.useForm();
  const [productAdjustForm] = Form.useForm();

  useEffect(() => {
    Promise.all([StockService.getBranches(), StockService.getIngredients()]).then(([b, i]) => {
      setBranches(b);
      setIngredients(i);
      if (b.length) setSelectedBranch((prev) => prev || b[0].id);
    });
  }, []);

  const swrOpts = { revalidateOnFocus: true, dedupingInterval: REVALIDATE_INTERVAL, keepPreviousData: true };
  const swrFresh = { ...swrOpts, keepPreviousData: false, dedupingInterval: 0 };

  const stockKey = selectedBranch
    ? `/api/stock?branchId=${selectedBranch}&page=${pageStock}&pageSize=${PAGE_SIZE}`
    : null;

  const ingredientMovementsKey = selectedBranch
    ? `/api/stock/movements?branchId=${selectedBranch}&page=${pageHistory}&pageSize=${PAGE_SIZE}`
    : null;

  const productMovementsKey = selectedBranch
    ? `/api/stock/product-movements?branchId=${selectedBranch}&page=${pageHistory}&pageSize=${PAGE_SIZE}`
    : null;

  const productStockKey = selectedBranch ? `/api/stock/products?branchId=${selectedBranch}` : null;

  const { data: stockData, isLoading: loadingStock, mutate: mutateStock } =
    useSWR(stockKey, fetcher<StockRow>, swrOpts);

  const { data: alertsData, mutate: mutateAlerts } =
    useSWR(selectedBranch ? `/api/stock/alerts?branchId=${selectedBranch}` : null, fetcher<StockRow>, swrOpts);

  const { data: ingredientMovementsData, isLoading: loadingIngredientMovements, mutate: mutateIngredientMovements } =
    useSWR(ingredientMovementsKey, fetcher<Movement>, swrOpts);

  const { data: productMovementsData, isLoading: loadingProductMovements, mutate: mutateProductMovements } =
    useSWR(productMovementsKey, fetcher<ProductMovement>, swrOpts);

  const { data: productStockData, isLoading: loadingProductStock, mutate: mutateProductStock } =
    useSWR(productStockKey, fetcher<ProductStockRow>, swrFresh);

  const { data: resaleVariantsData } =
    useSWR("/api/stock/resale-variants", fetcher<{ id: string; name: string; products: { id: string; name: string } | null }>, swrOpts);

  const stock = stockData?.data ?? [];
  const totalStock = stockData?.total ?? 0;
  const alerts = alertsData?.data ?? [];
  const productStock = loadingProductStock ? [] : (productStockData?.data ?? []);

  // Merge ingredient + product movements sorted by date
  const ingredientMovements = ingredientMovementsData?.data ?? [];
  const productMovements = productMovementsData?.data ?? [];

  const unifiedMovements: UnifiedMovement[] = [
    ...ingredientMovements.map((m): UnifiedMovement => ({
      id: m.id,
      created_at: m.created_at,
      detail: m.ingredients?.name ?? m.ingredient_id,
      quantity: m.quantity,
      type: m.type,
      notes: m.notes,
      origin: "insumo",
    })),
    ...productMovements.map((m): UnifiedMovement => ({
      id: m.id,
      created_at: m.created_at,
      detail: m.product_variants?.products?.name
        ? `${m.product_variants.products.name}${m.product_variants.name !== "Unidad" ? ` — ${m.product_variants.name}` : ""}`
        : m.variant_id,
      quantity: m.quantity,
      type: m.type,
      notes: m.notes,
      origin: "reventa",
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalHistory = (ingredientMovementsData?.total ?? 0) + (productMovementsData?.total ?? 0);
  const loadingHistory = loadingIngredientMovements || loadingProductMovements;

  const productVariants: ProductVariantOption[] = (resaleVariantsData?.data ?? []).map((r) => ({
    variantId: r.id,
    productName: (r.products as { name: string } | null)?.name ?? "—",
    variantName: r.name,
  }));

  const refreshAll = () => {
    mutateStock();
    mutateAlerts();
    mutateIngredientMovements();
    mutateProductMovements();
    mutateProductStock();
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    setPageStock(1);
    setPageHistory(1);
    productPurchaseForm.resetFields();
    setPurchaseVariantIsNew(false);
  };

  const resetStockPage = () => setPageStock(1);

  const handlePurchaseVariantChange = (variantId: string) => {
    const isNew = !productStock.some((s) => s.variant_id === variantId);
    setPurchaseVariantIsNew(isNew);
    if (!isNew) productPurchaseForm.setFieldValue("min_quantity", undefined);
  };

  const handleProductPurchase = async (values: { variant_id: string; quantity: number; min_quantity?: number }) => {
    const result = await StockService.productPurchase({ branch_id: selectedBranch, ...values });
    if (result.ok) {
      productPurchaseForm.resetFields();
      setPurchaseVariantIsNew(false);
      refreshAll();
    } else {
      message.error(result.error);
    }
  };

  const handlePurchaseIngredientChange = (ingredientId: string) => {
    const isNew = !stock.some((s) => s.ingredient_id === ingredientId);
    setPurchaseIngredientIsNew(isNew);
    if (!isNew) purchaseForm.setFieldValue("min_quantity", undefined);
  };

  const handlePurchase = async (values: { ingredient_id: string; quantity: number; min_quantity?: number }) => {
    const result = await StockService.purchase({ branch_id: selectedBranch, ...values });
    if (result.ok) { purchaseForm.resetFields(); setPurchaseIngredientIsNew(false); resetStockPage(); refreshAll(); }
    else message.error(result.error);
  };

  const handleAdjust = async (values: { ingredient_id: string; real_quantity: number; notes?: string }) => {
    const result = await StockService.adjust({ branch_id: selectedBranch, ...values });
    if (result.ok) { adjustForm.resetFields(); resetStockPage(); refreshAll(); }
    else message.error(result.error);
  };

  const handleProductAdjust = async (values: { variant_id: string; real_quantity: number; notes?: string }) => {
    const result = await StockService.productAdjust({ branch_id: selectedBranch, ...values });
    if (result.ok) { productAdjustForm.resetFields(); refreshAll(); }
    else message.error(result.error);
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
    branches, ingredients, stock, totalStock, alerts,
    selectedBranch, setSelectedBranch: handleBranchChange,
    pageStock, setPageStock, resetStockPage,
    pageHistory, setPageHistory,
    PAGE_SIZE,
    loadingStock,
    minQtyOpen, setMinQtyOpen,
    editingStock,
    purchaseIngredientIsNew,
    purchaseForm, adjustForm, minQtyForm,
    handlePurchaseIngredientChange,
    handlePurchase, handleAdjust,
    openMinQty, handleMinQty,
    productStock, loadingProductStock,
    productVariants,
    purchaseVariantIsNew,
    productPurchaseForm,
    handlePurchaseVariantChange,
    handleProductPurchase,
    productAdjustForm,
    handleProductAdjust,
    unifiedMovements, totalHistory, loadingHistory,
  };
}
