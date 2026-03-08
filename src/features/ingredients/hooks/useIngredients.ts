"use client";

import { useState, useEffect, useCallback } from "react";
import { Form, notification } from "antd";
import { IngredientsService } from "../services/ingredients.service";
import type { Ingredient } from "../types/ingredient.types";

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form] = Form.useForm();

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    const data = await IngredientsService.getIngredients(showInactive);
    setIngredients(data);
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchIngredients(); }, [fetchIngredients]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Ingredient) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name, unit: record.unit });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (values: { name: string; unit: string }) => {
    setSaving(true);
    const result = editing
      ? await IngredientsService.updateIngredient(editing.id, values)
      : await IngredientsService.createIngredient(values);

    if (result.ok) {
      setModalOpen(false);
      fetchIngredients();
      notification.success({ message: editing ? "Insumo actualizado" : "Insumo creado" });
    } else {
      notification.error({ message: result.error ?? "Error al guardar" });
    }
    setSaving(false);
  };

  const handleToggleActive = async (record: Ingredient) => {
    const result = await IngredientsService.toggleActive(record.id, !record.is_active);
    if (result.ok) {
      fetchIngredients();
      notification.success({ message: record.is_active ? "Insumo desactivado" : "Insumo reactivado" });
    } else {
      notification.error({ message: result.error ?? "Error al actualizar" });
    }
  };

  return {
    ingredients,
    loading,
    saving,
    showInactive,
    setShowInactive,
    modalOpen,
    editing,
    form,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleToggleActive,
  };
}
