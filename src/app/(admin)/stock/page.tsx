"use client";

import { Select, Tag, Typography, Tabs, Space, Badge } from "antd";
import { WarningOutlined, ShoppingCartOutlined, ToolOutlined, HistoryOutlined } from "@ant-design/icons";
import { useStock } from "@/features/stock/hooks/useStock";
import { StockCurrentTable } from "@/features/stock/components/StockCurrentTable";
import { StockPurchaseForm } from "@/features/stock/components/StockPurchaseForm";
import { StockAdjustForm } from "@/features/stock/components/StockAdjustForm";
import { StockMovementsTable } from "@/features/stock/components/StockMovementsTable";
import { StockMinQtyModal } from "@/features/stock/components/StockMinQtyModal";

const { Title } = Typography;

export default function StockPage() {
  const {
    branches, ingredients, stock, movements, alerts,
    selectedBranch, setSelectedBranch, loading,
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
      label: <Space>Stock actual{alerts.length > 0 && <Badge count={alerts.length} />}</Space>,
      children: <StockCurrentTable stock={stock} loading={loading} onEditMinQty={openMinQty} />,
    },
    {
      key: "purchase",
      label: <Space><ShoppingCartOutlined />Registrar compra</Space>,
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
      label: <Space><ToolOutlined />Ajuste manual</Space>,
      children: <StockAdjustForm form={adjustForm} ingredients={ingredients} onSubmit={handleAdjust} />,
    },
    {
      key: "history",
      label: <Space><HistoryOutlined />Historial</Space>,
      children: <StockMovementsTable movements={movements} loading={loading} />,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Title level={4} className="!mb-0">Stock</Title>
          {alerts.length > 0 && (
            <Tag color="red" icon={<WarningOutlined />}>
              {alerts.length} insumo{alerts.length > 1 ? "s" : ""} bajo mínimo
            </Tag>
          )}
        </div>
        <Select
          value={selectedBranch}
          onChange={setSelectedBranch}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
          style={{ width: 200 }}
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
