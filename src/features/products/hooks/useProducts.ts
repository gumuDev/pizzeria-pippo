"use client";

import { useState, useEffect, useCallback } from "react";
import { notification } from "antd";
import { supabase } from "@/lib/supabase";
import { ProductsService } from "../services/products.service";
import type { Product, Ingredient, Branch } from "../types/product.types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [p, i, b] = await Promise.all([
      ProductsService.getProducts(showInactive),
      ProductsService.getIngredients(),
      ProductsService.getBranches(),
    ]);
    setProducts(p);
    setIngredients(i);
    setBranches(b);
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const openModal = (record?: Product) => {
    setEditing(record ?? null);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleToggleActive = async (product: Product) => {
    const token = await getToken();
    const { ok, error } = await ProductsService.patchProduct(product.id, { is_active: !product.is_active }, token);
    if (ok) {
      fetchAll();
      notification.success({ message: product.is_active ? "Producto desactivado" : "Producto reactivado" });
    } else {
      notification.error({ message: error ?? "Error al actualizar" });
    }
  };

  const filteredProducts = filterCategory
    ? products.filter((p) => p.category === filterCategory)
    : products;

  return {
    products: filteredProducts,
    allProducts: products,
    ingredients,
    branches,
    loading,
    modalOpen,
    editing,
    showInactive,
    setShowInactive,
    filterCategory,
    setFilterCategory,
    openModal,
    closeModal,
    handleToggleActive,
    fetchAll,
    getToken,
  };
}
