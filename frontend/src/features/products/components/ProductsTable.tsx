"use client";

import { useIsMobile } from "@/lib/useIsMobile";
import { ProductsTableHeader } from "./ProductsTableHeader";
import { ProductsCategoryFilters } from "./ProductsCategoryFilters";
import { ProductsMobileList } from "./ProductsMobileList";
import { ProductsDesktopTable } from "./ProductsDesktopTable";
import type { Product } from "../types/product.types";

interface Props {
  products: Product[];
  loading: boolean;
  showInactive: boolean;
  onToggleInactive: (val: boolean) => void;
  filterCategory: string | null;
  onFilterCategory: (cat: string | null) => void;
  search: string;
  onSearch: (val: string) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onToggleActive: (record: Product) => void;
}

export function ProductsTable({
  products, loading, showInactive, onToggleInactive,
  filterCategory, onFilterCategory,
  search, onSearch, page, pageSize, total, onPageChange,
  onToggleActive,
}: Props) {
  const isMobile = useIsMobile();

  return (
    <>
      <ProductsTableHeader search={search} onSearch={onSearch} showInactive={showInactive} onToggleInactive={onToggleInactive} />
      <ProductsCategoryFilters filterCategory={filterCategory} onFilterCategory={onFilterCategory} />
      {isMobile ? (
        <ProductsMobileList
          products={products}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onToggleActive={onToggleActive}
        />
      ) : (
        <ProductsDesktopTable
          products={products}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onToggleActive={onToggleActive}
        />
      )}
    </>
  );
}
