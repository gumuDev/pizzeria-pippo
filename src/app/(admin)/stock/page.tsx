"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Select, Tag, Tabs, Space, Badge } from "antd";
import { useStock } from "@/features/stock/hooks/useStock";
import { useIsMobile } from "@/lib/useIsMobile";
import { StockCurrentTable } from "@/features/stock/components/StockCurrentTable";
import { StockMinQtyModal } from "@/features/stock/components/StockMinQtyModal";
import { ProductStockTable } from "@/features/stock/components/ProductStockTable";
import { StockTypeSelector } from "@/features/stock/components/StockTypeSelector";
import { StockHistoryTable } from "@/features/stock/components/StockHistoryTable";
import type { StockType } from "@/features/stock/components/StockTypeSelector";

const ProductStockAdjustForm = dynamic(
  () => import("@/features/stock/components/ProductStockAdjustForm").then((m) => m.ProductStockAdjustForm),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);

const StockPurchaseForm = dynamic(
  () => import("@/features/stock/components/StockPurchaseForm").then((m) => m.StockPurchaseForm),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);
const StockAdjustForm = dynamic(
  () => import("@/features/stock/components/StockAdjustForm").then((m) => m.StockAdjustForm),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);
const ProductStockPurchaseForm = dynamic(
  () => import("@/features/stock/components/ProductStockPurchaseForm").then((m) => m.ProductStockPurchaseForm),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);

const IconWarning = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default function StockPage() {
  const isMobile = useIsMobile();
  const [purchaseType, setPurchaseType] = useState<StockType>("ingredient");
  const [adjustType, setAdjustType] = useState<StockType>("ingredient");

  const {
    branches, ingredients, stock, totalStock, alerts,
    selectedBranch, setSelectedBranch, loadingStock,
    pageStock, setPageStock, PAGE_SIZE,
    minQtyOpen, setMinQtyOpen, editingStock,
    purchaseIngredientIsNew,
    purchaseForm, adjustForm, minQtyForm,
    productAdjustForm, handleProductAdjust,
    handlePurchaseIngredientChange,
    handlePurchase, handleAdjust,
    openMinQty, handleMinQty,
    productStock, loadingProductStock,
    productVariants,
    purchaseVariantIsNew,
    productPurchaseForm,
    handlePurchaseVariantChange,
    handleProductPurchase,
    unifiedMovements, totalHistory, loadingHistory,
    pageHistory, setPageHistory,
  } = useStock();

  const stockActualSubTabs = [
    {
      key: "ingredients",
      label: "🧂 Insumos",
      children: (
        <StockCurrentTable
          stock={stock}
          loading={loadingStock}
          onEditMinQty={openMinQty}
          page={pageStock}
          total={totalStock}
          pageSize={PAGE_SIZE}
          onPageChange={setPageStock}
        />
      ),
    },
    {
      key: "products",
      label: "📦 Reventa",
      children: <ProductStockTable stock={productStock} loading={loadingProductStock} />,
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
      key: "purchase",
      label: isMobile ? "🛒" : "Registrar compra",
      children: (
        <div>
          <StockTypeSelector value={purchaseType} onChange={(t) => { setPurchaseType(t); }} />
          {purchaseType === "ingredient" ? (
            <StockPurchaseForm
              form={purchaseForm}
              ingredients={ingredients}
              isNewIngredient={purchaseIngredientIsNew}
              onIngredientChange={handlePurchaseIngredientChange}
              onSubmit={handlePurchase}
            />
          ) : (
            <ProductStockPurchaseForm
              form={productPurchaseForm}
              variants={productVariants}
              isNewVariant={purchaseVariantIsNew}
              onVariantChange={handlePurchaseVariantChange}
              onSubmit={handleProductPurchase}
            />
          )}
        </div>
      ),
    },
    {
      key: "adjust",
      label: isMobile ? "🔧" : "Ajuste manual",
      children: (
        <div>
          <StockTypeSelector value={adjustType} onChange={(t) => { setAdjustType(t); }} />
          {adjustType === "ingredient" ? (
            <StockAdjustForm form={adjustForm} ingredients={ingredients} onSubmit={handleAdjust} />
          ) : (
            <ProductStockAdjustForm
              form={productAdjustForm}
              variants={productVariants}
              onSubmit={handleProductAdjust}
            />
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
          pageSize={PAGE_SIZE}
          onPageChange={setPageHistory}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 className="text-lg font-semibold m-0">Stock</h2>
          {alerts.length > 0 && (
            <Tag color="red" icon={<IconWarning />}>
              {alerts.length} insumo{alerts.length > 1 ? "s" : ""} bajo mínimo
            </Tag>
          )}
        </div>
        <Select
          value={selectedBranch}
          onChange={setSelectedBranch}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
          style={{ width: isMobile ? "100%" : 200 }}
          placeholder="Seleccionar sucursal"
        />
      </div>
      <Tabs items={tabItems} />
      <StockMinQtyModal
        open={minQtyOpen}
        editingStock={editingStock}
        form={minQtyForm}
        onClose={() => setMinQtyOpen(false)}
        onSubmit={handleMinQty}
      />
    </div>
  );
}
