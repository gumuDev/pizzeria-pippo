"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductsTable } from "@/features/products/components/ProductsTable";
import { ProductModal } from "@/features/products/components/ProductModal";
import { useProducts } from "@/features/products/hooks/useProducts";

export default function ProductsPage() {
  const {
    products, allProducts, ingredients, loading,
    modalOpen, editing, showInactive, setShowInactive,
    filterCategory, setFilterCategory,
    openModal, closeModal,
    handleToggleActive, fetchAll,
  } = useProducts();

  const router = useRouter();
  const searchParams = useSearchParams();
  const handledEdit = useRef(false);

  // Open the edit modal when arriving from the detail page (?edit=<id>)
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || handledEdit.current || loading) return;
    const target = allProducts.find((p) => p.id === editId);
    if (target) {
      handledEdit.current = true;
      openModal(target);
      router.replace("/products");
    }
  }, [searchParams, allProducts, loading, openModal, router]);

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
        ingredients={ingredients}
        onClose={closeModal}
        onSave={() => { closeModal(); fetchAll(); }}
      />
    </div>
  );
}
