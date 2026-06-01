"use client";

import { useState, useEffect, useCallback } from "react";
import { PosService } from "../services/pos.service";
import type { Product } from "../types/pos.types";
import type { Promotion } from "@/lib/promotions";

interface VariantMeta {
  category: string;
  variantName: string;
}

export function usePosProducts(branchId: string | undefined) {
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    const token = await PosService.getToken();
    const result = await PosService.getProductsAndPromotions(id, token);
    setProducts(result.products);
    setPromotions(result.promotions);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (branchId) fetchData(branchId);
  }, [branchId, fetchData]);

  const getVariantPrice = (variant: Product["product_variants"][0], bid: string) => {
    const override = variant.branch_prices?.find((bp) => bp.branch_id === bid);
    return override ? override.price : variant.base_price;
  };

  // Build a lookup map: variantId → { category, variantName }
  const buildVariantMeta = (): Map<string, VariantMeta> => {
    const map = new Map<string, VariantMeta>();
    for (const product of products) {
      for (const variant of product.product_variants) {
        map.set(variant.id, { category: product.category, variantName: variant.name });
      }
    }
    return map;
  };

  const getPromoLabel = (variantId: string): string | null => {
    const variantMeta = buildVariantMeta();

    for (const promo of promotions) {
      for (const rule of promo.promotion_rules) {
        if (rule.variant_id === variantId) {
          if (promo.type === "BUY_X_GET_Y" && rule.buy_qty && rule.get_qty)
            return `${rule.buy_qty + rule.get_qty}x${rule.buy_qty}`;
          if (promo.type === "PERCENTAGE" && rule.discount_percent)
            return `${rule.discount_percent}% OFF`;
          if (promo.type === "COMBO") return "COMBO";
        }

        if (!rule.variant_id) {
          if (promo.type === "PERCENTAGE" && rule.discount_percent)
            return `${rule.discount_percent}% OFF`;

          if (promo.type === "COMBO") {
            const meta = variantMeta.get(variantId);
            const categoryMatch = !rule.category || meta?.category === rule.category;
            const sizeMatch = !rule.variant_size || meta?.variantName === rule.variant_size;
            if (categoryMatch && sizeMatch) return "COMBO";
          }
        }
      }
    }
    return null;
  };

  // Returns null for elaborated products (no stock cap), number for resale variants
  const getStockQty = (variantId: string): number | null => {
    for (const p of products) {
      const v = p.product_variants?.find((pv) => pv.id === variantId);
      if (v) return v.stock_quantity !== undefined ? (v.stock_quantity ?? null) : null;
    }
    return null;
  };

  const refreshProducts = () => { if (branchId) fetchData(branchId); };

  return { products, promotions, loading, getVariantPrice, getPromoLabel, getStockQty, refreshProducts };
}
