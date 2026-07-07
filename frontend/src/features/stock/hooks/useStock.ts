"use client";

import { useState, useEffect } from "react";
import { Form, message } from "antd";
import { StockService } from "../services/stock.service";
import { useIngredientStockData } from "./useIngredientStockData";
import { useProductStockData } from "./useProductStockData";
import type { Branch, Ingredient, StockRow, ProductStockRow, UnifiedMovement } from "../types/stock.types";

const PAGE_SIZE = 10;

function buildUnifiedMovements(
  ingredientMovements: ReturnType<typeof useIngredientStockData>["movements"],
  productMovements: ReturnType<typeof useProductStockData>["movements"],
): UnifiedMovement[] {
  return [
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
}

export function useStock() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [pageStock, setPageStock] = useState(1);
  const [pageHistory, setPageHistory] = useState(1);
  const [minQtyOpen, setMinQtyOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockRow | null>(null);
  const [productMinQtyOpen, setProductMinQtyOpen] = useState(false);
  const [editingProductStock, setEditingProductStock] = useState<ProductStockRow | null>(null);
  const [purchaseIngredientIsNew, setPurchaseIngredientIsNew] = useState(false);
  const [purchaseVariantIsNew, setPurchaseVariantIsNew] = useState(false);

  const [purchaseForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const [minQtyForm] = Form.useForm();
  const [productMinQtyForm] = Form.useForm();
  const [productPurchaseForm] = Form.useForm();
  const [productAdjustForm] = Form.useForm();

  useEffect(() => {
    Promise.all([StockService.getBranches(), StockService.getIngredients()]).then(([b, i]) => {
      setBranches(b);
      setIngredients(i);
      if (b.length) setSelectedBranch((prev) => prev || b[0].id);
    });
  }, []);

  const ing = useIngredientStockData(selectedBranch, pageStock, pageHistory, PAGE_SIZE);
  const prod = useProductStockData(selectedBranch, pageHistory, PAGE_SIZE);

  const { stock, totalStock, alerts, loadingStock } = ing;
  const { productStock, loadingProductStock, productVariants } = prod;

  const unifiedMovements = buildUnifiedMovements(ing.movements, prod.movements);
  const totalHistory = ing.totalMovements + prod.totalMovements;
  const loadingHistory = ing.loadingMovements || prod.loadingMovements;

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    setPageStock(1);
    setPageHistory(1);
    productPurchaseForm.resetFields();
    setPurchaseVariantIsNew(false);
  };

  const resetStockPage = () => setPageStock(1);

  const handlePurchaseIngredientChange = (ingredientId: string) => {
    const isNew = !stock.some((s) => s.ingredient_id === ingredientId);
    setPurchaseIngredientIsNew(isNew);
    if (!isNew) purchaseForm.setFieldValue("min_quantity", undefined);
  };

  const handlePurchaseVariantChange = (variantId: string) => {
    const isNew = !productStock.some((s) => s.variant_id === variantId);
    setPurchaseVariantIsNew(isNew);
    if (!isNew) productPurchaseForm.setFieldValue("min_quantity", undefined);
  };

  const handlePurchase = async (values: { ingredient_id: string; quantity: number; min_quantity?: number }) => {
    const result = await StockService.purchase({ branch_id: selectedBranch, ...values });
    if (result.ok) { purchaseForm.resetFields(); setPurchaseIngredientIsNew(false); resetStockPage(); ing.refreshStock(); ing.refreshMovements(); }
    else message.error(result.error);
  };

  const handleAdjust = async (values: { ingredient_id: string; real_quantity: number; notes?: string }) => {
    const result = await StockService.adjust({ branch_id: selectedBranch, ...values });
    if (result.ok) { adjustForm.resetFields(); resetStockPage(); ing.refreshStock(); ing.refreshMovements(); }
    else message.error(result.error);
  };

  const handleProductPurchase = async (values: { variant_id: string; quantity: number; min_quantity?: number }) => {
    const result = await StockService.productPurchase({ branch_id: selectedBranch, ...values });
    if (result.ok) { productPurchaseForm.resetFields(); setPurchaseVariantIsNew(false); prod.refreshProductStock(); prod.refreshMovements(); }
    else message.error(result.error);
  };

  const handleProductAdjust = async (values: { variant_id: string; real_quantity: number; notes?: string }) => {
    const result = await StockService.productAdjust({ branch_id: selectedBranch, ...values });
    if (result.ok) { productAdjustForm.resetFields(); prod.refreshProductStock(); prod.refreshMovements(); }
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
    if (ok) { setMinQtyOpen(false); resetStockPage(); ing.refreshStock(); }
  };

  const openProductMinQty = (record: ProductStockRow) => {
    setEditingProductStock(record);
    productMinQtyForm.setFieldsValue({ min_quantity: record.min_quantity });
    setProductMinQtyOpen(true);
  };

  const handleProductMinQty = async (values: { min_quantity: number }) => {
    if (!editingProductStock) return;
    const ok = await StockService.updateProductMinQuantity(editingProductStock.id, values.min_quantity);
    if (ok) { setProductMinQtyOpen(false); prod.refreshProductStock(); }
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
    productAdjustForm,
    handlePurchaseVariantChange,
    handleProductPurchase,
    handleProductAdjust,
    productMinQtyOpen, setProductMinQtyOpen,
    editingProductStock,
    productMinQtyForm,
    openProductMinQty, handleProductMinQty,
    unifiedMovements, totalHistory, loadingHistory,
  };
}
