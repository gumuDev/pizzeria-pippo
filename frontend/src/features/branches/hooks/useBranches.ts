"use client";

import { useState, useEffect, useCallback } from "react";
import { Form, notification } from "antd";
import { BranchesService } from "../services/branches.service";
import type { Branch, Cashier } from "../types/branch.types";

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [blockModal, setBlockModal] = useState<{ branch: Branch; cashiers: Cashier[] } | null>(null);
  const [form] = Form.useForm();

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    const data = await BranchesService.getBranches(showInactive);
    setBranches(data);
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Branch) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name, address: record.address ?? "" });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const closeBlockModal = () => setBlockModal(null);

  const handleSubmit = async (values: { name: string; address?: string }) => {
    setSaving(true);
    const result = editing
      ? await BranchesService.updateBranch(editing.id, values)
      : await BranchesService.createBranch(values);

    if (result.ok) {
      setModalOpen(false);
      fetchBranches();
      notification.success({ message: editing ? "Sucursal actualizada" : "Sucursal creada" });
    } else {
      notification.error({ message: result.error ?? "Error al guardar" });
    }
    setSaving(false);
  };

  const handleToggleActive = async (branch: Branch) => {
    const result = await BranchesService.toggleActive(branch.id, !branch.is_active);
    if (result.ok) {
      fetchBranches();
      notification.success({ message: branch.is_active ? "Sucursal desactivada" : "Sucursal reactivada" });
    } else if (result.cashiers) {
      setBlockModal({ branch, cashiers: result.cashiers });
    } else {
      notification.error({ message: result.error ?? "Error al actualizar" });
    }
  };

  return {
    branches,
    loading,
    saving,
    showInactive,
    setShowInactive,
    modalOpen,
    editing,
    blockModal,
    form,
    openCreate,
    openEdit,
    closeModal,
    closeBlockModal,
    handleSubmit,
    handleToggleActive,
  };
}
