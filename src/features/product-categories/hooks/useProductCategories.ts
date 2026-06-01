"use client";

import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { supabase } from "@/lib/supabase";
import type { ProductCategory, ProductCategoryInput } from "../types/product-category.types";
import {
  getProductCategories, createProductCategory,
  updateProductCategory, deleteProductCategory,
} from "../services/product-categories.service";
import { invalidatePublicCategoriesCache } from "./useProductCategoriesPublic";

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await getProductCategories(token);
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (cat: ProductCategory) => { setEditing(cat); setModalOpen(true); };
  const closeModal = () => { setEditing(null); setModalOpen(false); };

  const handleSave = async (input: ProductCategoryInput) => {
    setSaving(true);
    try {
      const token = await getToken();
      if (editing) {
        await updateProductCategory(token, editing.id, input);
      } else {
        await createProductCategory(token, input);
      }
      invalidatePublicCategoriesCache();
      await load();
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    const result = await deleteProductCategory(token, id);
    invalidatePublicCategoriesCache();
    await load();
    if (result.soft) {
      message.warning(`Categoría desactivada — tiene ${result.count} producto(s). Cámbiales la categoría para que vuelvan a estar disponibles.`, 6);
    } else {
      message.success("Categoría eliminada");
    }
  };

  return { categories, loading, saving, modalOpen, editing, openCreate, openEdit, closeModal, handleSave, handleDelete };
}
