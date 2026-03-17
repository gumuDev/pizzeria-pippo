"use client";

import dynamic from "next/dynamic";
import { Select, Tag, Tabs, Space, Badge } from "antd";
import { useStock } from "@/features/stock/hooks/useStock";
import { useIsMobile } from "@/lib/useIsMobile";
import { StockCurrentTable } from "@/features/stock/components/StockCurrentTable";
import { StockMinQtyModal } from "@/features/stock/components/StockMinQtyModal";

const StockPurchaseForm = dynamic(
  () => import("@/features/stock/components/StockPurchaseForm").then((m) => m.StockPurchaseForm),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);
const StockAdjustForm = dynamic(
  () => import("@/features/stock/components/StockAdjustForm").then((m) => m.StockAdjustForm),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);
const StockMovementsTable = dynamic(
  () => import("@/features/stock/components/StockMovementsTable").then((m) => m.StockMovementsTable),
  { ssr: false, loading: () => <div className="p-8 text-gray-400 text-sm">Cargando...</div> }
);

const IconWarning = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconCart = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const IconTool = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const IconHistory = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconDatabase = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

export default function StockPage() {
  const isMobile = useIsMobile();
  const {
    branches, ingredients, stock, totalStock, movements, totalMovements, alerts,
    selectedBranch, setSelectedBranch, loading,
    pageStock, setPageStock, pageMovements, setPageMovements, PAGE_SIZE,
    minQtyOpen, setMinQtyOpen, editingStock,
    purchaseIngredientIsNew,
    purchaseForm, adjustForm, minQtyForm,
    handlePurchaseIngredientChange,
    handlePurchase, handleAdjust,
    openMinQty, handleMinQty,
  } = useStock();

  const tabItems = [
    {
      key: "stock",
      label: isMobile
        ? <Badge count={alerts.length} size="small"><IconDatabase /></Badge>
        : <Space>Stock actual{alerts.length > 0 && <Badge count={alerts.length} />}</Space>,
      children: <StockCurrentTable stock={stock} loading={loading} onEditMinQty={openMinQty} page={pageStock} total={totalStock} pageSize={PAGE_SIZE} onPageChange={setPageStock} />,
    },
    {
      key: "purchase",
      label: isMobile ? <IconCart /> : <Space><IconCart />Registrar compra</Space>,
      children: (
        <StockPurchaseForm
          form={purchaseForm}
          ingredients={ingredients}
          isNewIngredient={purchaseIngredientIsNew}
          onIngredientChange={handlePurchaseIngredientChange}
          onSubmit={handlePurchase}
        />
      ),
    },
    {
      key: "adjust",
      label: isMobile ? <IconTool /> : <Space><IconTool />Ajuste manual</Space>,
      children: <StockAdjustForm form={adjustForm} ingredients={ingredients} onSubmit={handleAdjust} />,
    },
    {
      key: "history",
      label: isMobile ? <IconHistory /> : <Space><IconHistory />Historial</Space>,
      children: <StockMovementsTable movements={movements} loading={loading} page={pageMovements} total={totalMovements} pageSize={PAGE_SIZE} onPageChange={setPageMovements} />,
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
