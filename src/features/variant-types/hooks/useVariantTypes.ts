"use client";

import { useState, useEffect, useCallback } from "react";
import { notification } from "antd";
import { VariantTypesService } from "../services/variant-types.service";
import type { VariantType } from "../types/variant-type.types";

export function useVariantTypes() {
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VariantType | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await VariantTypesService.getVariantTypes(false);
    setVariantTypes(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (record: VariantType) => { setEditing(record); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSave = async (name: string, sort_order: number) => {
    setSaving(true);
    const token = await VariantTypesService.getToken();
    const result = editing
      ? await VariantTypesService.update(editing.id, name, sort_order, token)
      : await VariantTypesService.create(name, sort_order, token);
    setSaving(false);

    if (result.ok) {
      notification.success({ message: editing ? "Tipo actualizado" : "Tipo creado" });
      closeModal();
      load();
    } else {
      notification.error({ message: result.error ?? "Error al guardar" });
    }
  };

  const handleToggle = async (record: VariantType) => {
    const token = await VariantTypesService.getToken();
    const result = await VariantTypesService.toggle(record.id, !record.is_active, token);
    if (result.ok) {
      load();
    } else {
      notification.error({ message: result.error ?? "Error al cambiar estado" });
    }
  };

  return {
    variantTypes, loading, saving,
    modalOpen, editing,
    openCreate, openEdit, closeModal,
    handleSave, handleToggle,
  };
}
