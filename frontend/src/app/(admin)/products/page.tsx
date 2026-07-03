"use client";

import { ProductsTable } from "@/features/products/components/ProductsTable";
import { useProducts } from "@/features/products/hooks/useProducts";

export default function ProductsPage() {
  const {
    products, total, page, PAGE_SIZE, setPage,
    loading, showInactive, setShowInactive,
    filterCategory, setFilterCategory,
    search, setSearch,
    handleToggleActive,
  } = useProducts();

  return (
    <div className="p-6">
      <ProductsTable
        products={products}
        loading={loading}
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        filterCategory={filterCategory}
        onFilterCategory={setFilterCategory}
        search={search}
        onSearch={setSearch}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
