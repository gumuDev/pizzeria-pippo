"use client";

import { useState } from "react";
import useSWR from "swr";
import { message } from "antd";
import { ProductsService } from "../services/products.service";
import type { Branch, VariantWithPrices } from "../types/product.types";

export function useProductBranchPrices(productId: string) {
  const [saving, setSaving] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    productId ? ["product-branch-prices", productId] : null,
    () => ProductsService.getBranchPrices(productId)
  );

  const variants: VariantWithPrices[] = data?.variants ?? [];
  const branches: Branch[] = data?.branches ?? [];

  const savePrice = async (variantId: string, branchId: string, price: number) => {
    setSaving(true);
    const result = await ProductsService.saveBranchPrice(productId, variantId, branchId, price);
    setSaving(false);
    if (result.ok) {
      message.success("Precio guardado");
      mutate();
    } else {
      message.error(result.error ?? "Error al guardar");
    }
  };

  return { variants, branches, isLoading, saving, savePrice };
}
