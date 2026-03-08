"use client";

import { BranchesTable } from "@/features/branches/components/BranchesTable";
import { BranchModal } from "@/features/branches/components/BranchModal";
import { BranchBlockedModal } from "@/features/branches/components/BranchBlockedModal";
import { useBranches } from "@/features/branches/hooks/useBranches";

export default function BranchesPage() {
  const {
    branches, loading, saving, showInactive, setShowInactive,
    modalOpen, editing, blockModal, form,
    openCreate, openEdit, closeModal, closeBlockModal,
    handleSubmit, handleToggleActive,
  } = useBranches();

  return (
    <div className="p-6">
      <BranchesTable
        branches={branches}
        loading={loading}
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        onCreate={openCreate}
        onEdit={openEdit}
        onToggleActive={handleToggleActive}
      />
      <BranchModal
        open={modalOpen}
        editing={editing}
        saving={saving}
        form={form}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <BranchBlockedModal
        data={blockModal}
        onClose={closeBlockModal}
      />
    </div>
  );
}
