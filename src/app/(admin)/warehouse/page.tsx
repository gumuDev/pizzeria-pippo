"use client";

import { useRouter } from "next/navigation";
import { Tag, Space, Button, Input, Select } from "antd";
import { useWarehouse } from "@/features/warehouse/hooks/useWarehouse";
import { WarehouseTable } from "@/features/warehouse/components/WarehouseTable";
import { WarehouseAdjustModal, WarehouseMinQtyModal } from "@/features/warehouse/components/WarehouseModals";

const IconWarning = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconHistory = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconCart = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IconSwap = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);
const IconSearch = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export default function WarehousePage() {
  const router = useRouter();
  const {
    filteredRows, displayMobileRows, total, isLoading,
    isMobile, mobileRows, loadingMore, hasMore,
    alertCount, search, filterStatus, page, PAGE_SIZE,
    editingRow, adjustingRow, adjustLoading,
    minQtyForm, adjustForm,
    setSearch, setPage,
    handleStatusFilter, handleSentinel,
    openMinQty, openAdjust,
    handleDelete, handleAdjust, handleMinQty,
    closeAdjust, closeMinQty,
  } = useWarehouse();

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, marginBottom: 16 }}>
        <Space>
          <h2 className="text-lg font-semibold m-0">Bodega Central</h2>
          {alertCount > 0 && (
            <Tag color="red" icon={<IconWarning />}>
              {alertCount} insumo{alertCount > 1 ? "s" : ""} bajo mínimo
            </Tag>
          )}
        </Space>
        <Space wrap>
          <Button icon={<IconHistory />} onClick={() => router.push("/warehouse/movements")} block={isMobile}>Historial</Button>
          <Button icon={<IconCart />} onClick={() => router.push("/warehouse/purchase")} block={isMobile}>{isMobile ? "Compra" : "Nueva compra"}</Button>
          <Button type="primary" icon={<IconSwap />} onClick={() => router.push("/warehouse/transfer")} block={isMobile}>Transferir</Button>
        </Space>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <Input
          placeholder="Buscar insumo..."
          prefix={<IconSearch />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: isMobile ? "100%" : 220 }}
        />
        <Select
          placeholder="Estado"
          allowClear
          value={filterStatus}
          onChange={handleStatusFilter}
          style={{ width: isMobile ? "100%" : 140 }}
          options={[{ value: "low", label: "Stock bajo" }, { value: "ok", label: "OK" }]}
        />
      </div>

      <WarehouseTable
        rows={filteredRows}
        filteredRows={filteredRows}
        displayMobileRows={displayMobileRows}
        total={total}
        isLoading={isLoading}
        isMobile={isMobile}
        loadingMore={loadingMore}
        hasMore={hasMore}
        page={page}
        PAGE_SIZE={PAGE_SIZE}
        mobileRows={mobileRows}
        sentinelRef={handleSentinel}
        onPageChange={setPage}
        onAdjust={openAdjust}
        onEditMinQty={openMinQty}
        onDelete={handleDelete}
      />

      <WarehouseAdjustModal
        adjustingRow={adjustingRow}
        form={adjustForm}
        loading={adjustLoading}
        onSubmit={handleAdjust}
        onClose={closeAdjust}
      />
      <WarehouseMinQtyModal
        editingRow={editingRow}
        form={minQtyForm}
        onSubmit={handleMinQty}
        onClose={closeMinQty}
      />
    </div>
  );
}
