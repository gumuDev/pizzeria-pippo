"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, Space, Badge } from "antd";
import type { FormInstance } from "antd";
import { StockCurrentTable } from "./StockCurrentTable";
import { ProductStockTable } from "./ProductStockTable";
import { StockTypeSelector } from "./StockTypeSelector";
import { StockHistoryTable } from "./StockHistoryTable";
import type { StockRow, ProductStockRow, Ingredient, ProductVariantOption, UnifiedMovement, StockType } from "../types/stock.types";

const StockAdjustForm = dynamic(
  () => import("./StockAdjustForm").then((m) => m.StockAdjustForm),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);
const ProductStockAdjustForm = dynamic(
  () => import("./ProductStockAdjustForm").then((m) => m.ProductStockAdjustForm),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);

interface Props {
  isMobile: boolean;
  alerts: StockRow[];
  stock: StockRow[];
  loadingStock: boolean;
  onEditMinQty: (row: StockRow) => void;
  pageStock: number;
  totalStock: number;
  pageSize: number;
  onPageStockChange: (page: number) => void;
  productStock: ProductStockRow[];
  loadingProductStock: boolean;
  onEditProductMinQty: (row: ProductStockRow) => void;
  ingredients: Ingredient[];
  adjustForm: FormInstance;
  onAdjust: (values: { ingredient_id: string; real_quantity: number; notes?: string }) => void;
  productVariants: ProductVariantOption[];
  productAdjustForm: FormInstance;
  onProductAdjust: (values: { variant_id: string; real_quantity: number; notes?: string }) => void;
  unifiedMovements: UnifiedMovement[];
  totalHistory: number;
  loadingHistory: boolean;
  pageHistory: number;
  onPageHistoryChange: (page: number) => void;
}

export function StockTabs({
  isMobile, alerts,
  stock, loadingStock, onEditMinQty, pageStock, totalStock, pageSize, onPageStockChange,
  productStock, loadingProductStock, onEditProductMinQty,
  ingredients, adjustForm, onAdjust,
  productVariants, productAdjustForm, onProductAdjust,
  unifiedMovements, totalHistory, loadingHistory, pageHistory, onPageHistoryChange,
}: Props) {
  const [adjustType, setAdjustType] = useState<StockType>("ingredient");

  const stockActualSubTabs = [
    {
      key: "ingredients",
      label: "🧂 Insumos",
      children: (
        <StockCurrentTable
          stock={stock}
          loading={loadingStock}
          onEditMinQty={onEditMinQty}
          page={pageStock}
          total={totalStock}
          pageSize={pageSize}
          onPageChange={onPageStockChange}
        />
      ),
    },
    {
      key: "products",
      label: "📦 Reventa",
      children: <ProductStockTable stock={productStock} loading={loadingProductStock} onEditMinQty={onEditProductMinQty} />,
    },
  ];

  const tabItems = [
    {
      key: "stock",
      label: isMobile
        ? <Badge count={alerts.length} size="small">📋</Badge>
        : <Space>Stock actual{alerts.length > 0 && <Badge count={alerts.length} />}</Space>,
      children: <Tabs items={stockActualSubTabs} size="small" />,
    },
    {
      key: "adjust",
      label: isMobile ? "🔧" : "Ajuste manual",
      children: (
        <div>
          <StockTypeSelector value={adjustType} onChange={setAdjustType} />
          {adjustType === "ingredient" ? (
            <StockAdjustForm form={adjustForm} ingredients={ingredients} onSubmit={onAdjust} />
          ) : (
            <ProductStockAdjustForm form={productAdjustForm} variants={productVariants} onSubmit={onProductAdjust} />
          )}
        </div>
      ),
    },
    {
      key: "history",
      label: isMobile ? "🕐" : "Historial",
      children: (
        <StockHistoryTable
          movements={unifiedMovements}
          loading={loadingHistory}
          page={pageHistory}
          total={totalHistory}
          pageSize={pageSize}
          onPageChange={onPageHistoryChange}
        />
      ),
    },
  ];

  return <Tabs items={tabItems} />;
}
