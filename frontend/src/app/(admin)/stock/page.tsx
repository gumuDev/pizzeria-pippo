"use client";

import { useStock } from "@/features/stock/hooks/useStock";
import { useIsMobile } from "@/lib/useIsMobile";
import { StockPageHeader } from "@/features/stock/components/StockPageHeader";
import { StockTabs } from "@/features/stock/components/StockTabs";
import { StockMinQtyModal } from "@/features/stock/components/StockMinQtyModal";

export default function StockPage() {
  const isMobile = useIsMobile();

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

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <StockPageHeader
        isMobile={isMobile}
        alertCount={alerts.length}
        branches={branches}
        selectedBranch={selectedBranch}
        onSelectedBranchChange={setSelectedBranch}
      />
      <StockTabs
        isMobile={isMobile}
        alerts={alerts}
        stock={stock}
        loadingStock={loadingStock}
        onEditMinQty={openMinQty}
        pageStock={pageStock}
        totalStock={totalStock}
        pageSize={PAGE_SIZE}
        onPageStockChange={setPageStock}
        productStock={productStock}
        loadingProductStock={loadingProductStock}
        onEditProductMinQty={openProductMinQty}
        ingredients={ingredients}
        adjustForm={adjustForm}
        onAdjust={handleAdjust}
        productVariants={productVariants}
        productAdjustForm={productAdjustForm}
        onProductAdjust={handleProductAdjust}
        unifiedMovements={unifiedMovements}
        totalHistory={totalHistory}
        loadingHistory={loadingHistory}
        pageHistory={pageHistory}
        onPageHistoryChange={setPageHistory}
      />
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
