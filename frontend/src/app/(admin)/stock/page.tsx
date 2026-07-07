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
import type { StockType } from "@/features/stock/types/stock.types";

const StockAdjustForm = dynamic(
  () => import("@/features/stock/components/StockAdjustForm").then((m) => m.StockAdjustForm),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);
const ProductStockAdjustForm = dynamic(
  () => import("@/features/stock/components/ProductStockAdjustForm").then((m) => m.ProductStockAdjustForm),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);

const IconWarning = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default function StockPage() {
  const isMobile = useIsMobile();
  const [adjustType, setAdjustType] = useState<StockType>("ingredient");

  const {
    branches, ingredients, stock, totalStock, alerts,
    selectedBranch, setSelectedBranch, loadingStock,
    pageStock, setPageStock, PAGE_SIZE,
    minQtyOpen, setMinQtyOpen, editingStock,
    adjustForm, minQtyForm,
    productAdjustForm, handleProductAdjust,
    handleAdjust,
    openMinQty, handleMinQty,
    productStock, loadingProductStock,
    productVariants,
    productMinQtyOpen, setProductMinQtyOpen,
    editingProductStock,
    productMinQtyForm,
    openProductMinQty, handleProductMinQty,
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
      children: <ProductStockTable stock={productStock} loading={loadingProductStock} onEditMinQty={openProductMinQty} />,
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
      <StockMinQtyModal
        open={productMinQtyOpen}
        editingStock={null}
        productStock={editingProductStock}
        form={productMinQtyForm}
        onClose={() => setProductMinQtyOpen(false)}
        onSubmit={handleProductMinQty}
      />
    </div>
  );
}
