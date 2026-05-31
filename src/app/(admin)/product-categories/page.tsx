"use client";

import { CategoriesTable } from "@/features/product-categories/components/CategoriesTable";
import { CategoryModal } from "@/features/product-categories/components/CategoryModal";
import { useProductCategories } from "@/features/product-categories/hooks/useProductCategories";

export default function ProductCategoriesPage() {
  const { categories, loading, saving, modalOpen, editing, openCreate, openEdit, closeModal, handleSave, handleDelete } = useProductCategories();

  return (
    <div className="p-6">
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 700 }}>Categorías de productos</h2>
      <CategoriesTable
        categories={categories}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <CategoryModal
        open={modalOpen}
        editing={editing}
        saving={saving}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  );
}
