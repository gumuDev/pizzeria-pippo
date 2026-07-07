"use client";

import { useState } from "react";
import useSWR from "swr";
import { message } from "antd";
import { getToken } from "@/lib/auth";
import type { Branch, VariantWithPrices } from "../types/product.types";

const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

async function fetcher(url: string) {
  const token = await getToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

export function useProductBranchPrices(productId: string) {
  const [saving, setSaving] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    productId ? `${NEST_API_URL}/products/${productId}/branch-prices` : null,
    fetcher
  );

  const variants: VariantWithPrices[] = data?.variants ?? [];
  const branches: Branch[] = data?.branches ?? [];

  const savePrice = async (variantId: string, branchId: string, price: number) => {
    setSaving(true);
    const token = await getToken();

    const res = await fetch(`${NEST_API_URL}/products/${productId}/branch-prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ variant_id: variantId, branch_id: branchId, price }),
    });

    setSaving(false);
    if (res.ok) {
      message.success("Precio guardado");
      mutate();
    } else {
      const json = await res.json();
      message.error(json.error ?? "Error al guardar");
    }
  };

  return { variants, branches, isLoading, saving, savePrice };
}
