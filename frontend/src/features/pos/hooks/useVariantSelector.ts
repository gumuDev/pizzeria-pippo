"use client";

import { useState, useEffect } from "react";
import type { Product, Variant } from "../types/pos.types";

interface FlavorEntry {
  variantId: string;
  productName: string;
  parts: number;
}

export function useVariantSelector(product: Product | null) {
  const [selectedSize, setSelectedSize] = useState<Variant | null>(null);
  const [flavors, setFlavors] = useState<FlavorEntry[]>([]);

  // Reset when a new product opens
  useEffect(() => {
    setSelectedSize(null);
    setFlavors([]);
  }, [product?.id]);

  // When size is selected, pre-load the current product as the first flavor
  const handleSelectSize = (variant: Variant) => {
    setSelectedSize(variant);
    const baseVariantId = product?.product_variants.find((v) => v.name === variant.name)?.id ?? variant.id;
    setFlavors([{ variantId: baseVariantId, productName: product?.name ?? "", parts: 1 }]);
  };

  const totalParts = flavors.reduce((sum, f) => sum + f.parts, 0);

  const addFlavor = (variantId: string, productName: string) => {
    setFlavors((prev) => [...prev, { variantId, productName, parts: 1 }]);
  };

  const updateParts = (idx: number, delta: number) => {
    setFlavors((prev) => prev.map((f, i) => i === idx ? { ...f, parts: Math.max(1, f.parts + delta) } : f));
  };

  const removeFlavor = (idx: number) => {
    setFlavors((prev) => prev.filter((_, i) => i !== idx));
  };

  return { selectedSize, flavors, totalParts, handleSelectSize, addFlavor, updateParts, removeFlavor };
}

export type { FlavorEntry };
