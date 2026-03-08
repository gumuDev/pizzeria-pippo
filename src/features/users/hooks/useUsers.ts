"use client";

import { useState, useEffect, useCallback } from "react";
import { Form, notification } from "antd";
import { UsersService } from "../services/users.service";
import type { User, Branch, UserRole } from "../types/user.types";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("cajero");
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const data = await UsersService.getUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  const fetchBranches = useCallback(async () => {
    const data = await UsersService.getBranches();
    setBranches(data);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [fetchUsers, fetchBranches]);

  const openCreate = () => {
    setEditing(null);
    setSelectedRole("cajero");
    form.resetFields();
    form.setFieldsValue({ role: "cajero" });
    setModalOpen(true);
  };

  const openEdit = (record: User) => {
    setEditing(record);
    setSelectedRole(record.role);
    form.setFieldsValue({
      full_name: record.full_name,
      role: record.role,
      branch_id: record.branch_id,
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === "admin") form.setFieldValue("branch_id", null);
  };

  const handleSubmit = async (values: {
    full_name: string;
    email?: string;
    password?: string;
    role: UserRole;
    branch_id?: string | null;
  }) => {
    setSaving(true);
    const result = editing
      ? await UsersService.updateUser(editing.id, {
          full_name: values.full_name,
          role: values.role,
          branch_id: values.branch_id ?? null,
        })
      : await UsersService.createUser({
          email: values.email!,
          password: values.password!,
          full_name: values.full_name,
          role: values.role,
          branch_id: values.branch_id ?? null,
        });

    if (result.ok) {
      setModalOpen(false);
      fetchUsers();
      notification.success({ message: editing ? "Usuario actualizado" : "Usuario creado" });
    } else {
      notification.error({ message: result.error ?? "Error al guardar" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const result = await UsersService.deleteUser(id);
    if (result.ok) {
      fetchUsers();
      notification.success({ message: "Usuario eliminado" });
    } else {
      notification.error({ message: result.error ?? "Error al eliminar" });
    }
  };

  return {
    users,
    branches,
    loading,
    saving,
    modalOpen,
    editing,
    selectedRole,
    form,
    openCreate,
    openEdit,
    closeModal,
    handleRoleChange,
    handleSubmit,
    handleDelete,
  };
}
