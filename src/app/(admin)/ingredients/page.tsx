"use client";

import { IngredientsTable } from "@/features/ingredients/components/IngredientsTable";
import { IngredientModal } from "@/features/ingredients/components/IngredientModal";
import { useIngredients } from "@/features/ingredients/hooks/useIngredients";

export default function IngredientsPage() {
  const {
    ingredients, loading, saving, showInactive, setShowInactive,
    modalOpen, editing, form,
    openCreate, openEdit, closeModal,
    handleSubmit, handleToggleActive,
  } = useIngredients();

  return (
    <div className="p-6">
      <IngredientsTable
        ingredients={ingredients}
        loading={loading}
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        onCreate={openCreate}
        onEdit={openEdit}
        onToggleActive={handleToggleActive}
      />
      <IngredientModal
        open={modalOpen}
        editing={editing}
        saving={saving}
        form={form}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
