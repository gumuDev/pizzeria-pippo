"use client";

import { ProductsTable } from "@/features/products/components/ProductsTable";
import { ProductModal } from "@/features/products/components/ProductModal";
import { useProducts } from "@/features/products/hooks/useProducts";

export default function ProductsPage() {
  const {
    products, ingredients, branches, loading,
    modalOpen, editing, showInactive, setShowInactive,
    filterCategory, setFilterCategory,
    openModal, closeModal,
    handleToggleActive, fetchAll,
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
        onCreate={() => openModal()}
        onEdit={openModal}
        onToggleActive={handleToggleActive}
      />
      <ProductModal
        open={modalOpen}
        editing={editing}
        branches={branches}
        ingredients={ingredients}
        onClose={closeModal}
        onSave={() => { closeModal(); fetchAll(); }}
      />
    </div>
  );
}
