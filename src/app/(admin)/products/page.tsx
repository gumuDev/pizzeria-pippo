"use client";

import { ProductsTable } from "@/features/products/components/ProductsTable";
import { ProductModal } from "@/features/products/components/ProductModal";
import { useProducts } from "@/features/products/hooks/useProducts";

export default function ProductsPage() {
  const {
    products, total, page, PAGE_SIZE, setPage,
    ingredients, loading,
    modalOpen, editing,
    showInactive, setShowInactive,
    filterCategory, setFilterCategory,
    search, setSearch,
    openModal, closeModal,
    handleToggleActive, handleSaved,
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
        onCreate={() => openModal()}
        onEdit={openModal}
        onToggleActive={handleToggleActive}
      />
      <ProductModal
        open={modalOpen}
        editing={editing}
        ingredients={ingredients}
        onClose={closeModal}
        onSave={handleSaved}
      />
    </div>
  );
}
