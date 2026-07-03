"use client";

import { UsersTable } from "@/features/users/components/UsersTable";
import { UserModal } from "@/features/users/components/UserModal";
import { useUsers } from "@/features/users/hooks/useUsers";

export default function UsersPage() {
  const {
    users, branches, loading, saving,
    modalOpen, editing, selectedRole, form,
    openCreate, openEdit, closeModal,
    handleRoleChange, handleSubmit, handleToggleBan, handleDelete,
  } = useUsers();

  return (
    <div className="p-6">
      <UsersTable
        users={users}
        branches={branches}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
        onToggleBan={handleToggleBan}
        onDelete={handleDelete}
      />
      <UserModal
        open={modalOpen}
        editing={editing}
        saving={saving}
        selectedRole={selectedRole}
        branches={branches}
        form={form}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onRoleChange={handleRoleChange}
      />
    </div>
  );
}
