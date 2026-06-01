"use client";

import { useState } from "react";
import useSWR from "swr";
import { message } from "antd";
import { supabase } from "@/lib/supabase";

export interface BranchPriceRow {
  id: string;
  branch_id: string;
  price: number;
  branches: { id: string; name: string } | null;
}

export interface VariantWithPrices {
  id: string;
  name: string;
  base_price: number;
  branch_prices: BranchPriceRow[];
}

export interface Branch {
  id: string;
  name: string;
}

async function fetcher(url: string) {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token ?? "";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

export function useProductBranchPrices(productId: string) {
  const [saving, setSaving] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    productId ? `/api/products/${productId}/branch-prices` : null,
    fetcher
  );

  const variants: VariantWithPrices[] = data?.variants ?? [];
  const branches: Branch[] = data?.branches ?? [];

  const savePrice = async (variantId: string, branchId: string, price: number) => {
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? "";

    const res = await fetch(`/api/products/${productId}/branch-prices`, {
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
