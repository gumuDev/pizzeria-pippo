"use client";

import { Input, Select } from "antd";
import { WarehouseTable } from "./WarehouseTable";
import { IconSearch } from "./WarehouseIcons";
import type { WarehouseRow } from "../types/warehouse.types";

interface Props {
  isMobile: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filterStatus: "low" | "ok" | undefined;
  onStatusFilterChange: (value: "low" | "ok" | undefined) => void;
  filteredRows: WarehouseRow[];
  displayMobileRows: WarehouseRow[];
  mobileRows: WarehouseRow[];
  total: number;
  isLoading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  page: number;
  pageSize: number;
  sentinelRef: (node: HTMLDivElement | null) => void;
  onPageChange: (page: number) => void;
  onAdjust: (row: WarehouseRow) => void;
  onEditMinQty: (row: WarehouseRow) => void;
  onDelete: (row: WarehouseRow) => void;
}

export function WarehouseIngredientsTab({
  isMobile, search, onSearchChange, filterStatus, onStatusFilterChange,
  filteredRows, displayMobileRows, mobileRows, total, isLoading, loadingMore, hasMore,
  page, pageSize, sentinelRef, onPageChange, onAdjust, onEditMinQty, onDelete,
}: Props) {
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <Input
          placeholder="Buscar insumo..."
          prefix={<IconSearch />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          style={{ width: isMobile ? "100%" : 220 }}
        />
        <Select
          placeholder="Estado"
          allowClear
          value={filterStatus}
          onChange={onStatusFilterChange}
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
        PAGE_SIZE={pageSize}
        mobileRows={mobileRows}
        sentinelRef={sentinelRef}
        onPageChange={onPageChange}
        onAdjust={onAdjust}
        onEditMinQty={onEditMinQty}
        onDelete={onDelete}
      />
    </>
  );
}
