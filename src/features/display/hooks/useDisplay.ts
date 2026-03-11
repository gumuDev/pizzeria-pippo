"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { DisplayMode, DisplayCartItem, DisplayProduct, OrderType } from "../types/display.types";

export function useDisplay() {
  const [mode, setMode] = useState<DisplayMode>("menu");
  const [cartItems, setCartItems] = useState<DisplayCartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [menuPage, setMenuPage] = useState(0);
  const thanksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, category, description, image_url, product_variants(id, name, base_price)")
        .eq("is_active", true)
        .order("category")
        .order("name");
      if (data) setProducts(data);
    };
    load();
  }, []);

  useEffect(() => {
    if (mode !== "menu" || products.length === 0) return;
    const pages = Math.ceil(products.length / 6);
    const interval = setInterval(() => {
      setMenuPage((prev) => (prev + 1) % pages);
    }, 6000);
    return () => clearInterval(interval);
  }, [mode, products.length]);

  useEffect(() => {
    channelRef.current = new BroadcastChannel("pos-display");

    channelRef.current.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === "CART_UPDATE") {
        setCartItems(payload.items ?? []);
        setCartTotal(payload.total ?? 0);
        setOrderType(payload.orderType ?? null);
        setMode("order");
      } else if (type === "CART_CLEAR") {
        setCartItems([]);
        setCartTotal(0);
        setOrderType(null);
        setMode("menu");
        setMenuPage(0);
      } else if (type === "ORDER_COMPLETE") {
        setCartItems([]);
        setCartTotal(0);
        setOrderType(null);
        setMode("thanks");
        if (thanksTimerRef.current) clearTimeout(thanksTimerRef.current);
        thanksTimerRef.current = setTimeout(() => {
          setMode("menu");
          setMenuPage(0);
        }, 3000);
      }
    };

    return () => {
      channelRef.current?.close();
      if (thanksTimerRef.current) clearTimeout(thanksTimerRef.current);
    };
  }, []);

  return { mode, cartItems, cartTotal, orderType, products, menuPage };
}
