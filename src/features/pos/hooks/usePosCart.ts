"use client";

import { useState, useEffect, useRef } from "react";
import {
  applyPromotions, getActivePromotions, getTotalDiscount, getCartTotal,
  type CartItem, type DiscountedItem, type Promotion,
} from "@/lib/promotions";
import type { Product } from "../types/pos.types";

export function usePosCart(
  promotions: Promotion[],
  branchId: string | undefined,
  broadcast: (type: string, payload?: unknown) => void
) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountedCart, setDiscountedCart] = useState<DiscountedItem[]>([]);
  const suppressClearRef = useRef(false);

  useEffect(() => {
    if (cart.length === 0) {
      setDiscountedCart([]);
      if (!suppressClearRef.current) broadcast("CART_CLEAR");
      suppressClearRef.current = false;
      return;
    }
    const active = getActivePromotions(promotions, branchId ?? "");
    const result = applyPromotions(cart, active);
    setDiscountedCart(result);
    broadcast("CART_UPDATE", { items: result, total: getCartTotal(result) });
  }, [cart, promotions, branchId, broadcast]);

  const addToCart = (product: Product, variant: Product["product_variants"][0], price: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variant_id === variant.id);
      if (existing) return prev.map((i) => i.variant_id === variant.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        variant_id: variant.id,
        qty: 1,
        unit_price: price,
        product_name: product.name,
        variant_name: variant.name,
        category: product.category,
      }];
    });
  };

  const updateQty = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => i.variant_id === variantId ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0)
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variant_id !== variantId));
  };

  const clearCart = () => {
    setCart([]);
    broadcast("CART_CLEAR");
  };

  const suppressNextClear = () => { suppressClearRef.current = true; };

  const total = getCartTotal(discountedCart);
  const totalDiscount = getTotalDiscount(discountedCart);

  return {
    cart, discountedCart, total, totalDiscount,
    addToCart, updateQty, removeFromCart, clearCart, suppressNextClear,
  };
}
