"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { DiscountedItem } from "@/lib/promotions";

type DisplayMode = "menu" | "order" | "thanks";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  product_variants: { id: string; name: string; base_price: number }[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  pizza: "🍕",
  bebida: "🥤",
  otro: "🍽️",
};

const CATEGORY_LABEL: Record<string, string> = {
  pizza: "Pizzas",
  bebida: "Bebidas",
  otro: "Otros",
};

export default function DisplayPage() {
  const [mode, setMode] = useState<DisplayMode>("menu");
  const [cartItems, setCartItems] = useState<DiscountedItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [menuPage, setMenuPage] = useState(0);
  const thanksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Load products for menu mode
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

  // Auto-rotate menu pages every 6 seconds
  useEffect(() => {
    if (mode !== "menu" || products.length === 0) return;
    const pages = Math.ceil(products.length / 6);
    const interval = setInterval(() => {
      setMenuPage((prev) => (prev + 1) % pages);
    }, 6000);
    return () => clearInterval(interval);
  }, [mode, products.length]);

  // BroadcastChannel listener
  useEffect(() => {
    channelRef.current = new BroadcastChannel("pos-display");

    channelRef.current.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === "CART_UPDATE") {
        setCartItems(payload.items ?? []);
        setCartTotal(payload.total ?? 0);
        setMode("order");
      } else if (type === "CART_CLEAR") {
        setCartItems([]);
        setCartTotal(0);
        setMode("menu");
        setMenuPage(0);
      } else if (type === "ORDER_COMPLETE") {
        setCartItems([]);
        setCartTotal(0);
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

  const visibleProducts = products.slice(menuPage * 6, menuPage * 6 + 6);
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 bg-orange-600">
        <div className="flex items-center gap-3">
          <Image
            src="/pippo.jpg"
            alt="Pippo Pizza"
            width={44}
            height={44}
            style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
          <span className="text-2xl font-bold tracking-wide">Pizzería Pippo</span>
        </div>
        <span className="text-orange-200 text-sm">
          {mode === "order" ? "Tu pedido" : mode === "thanks" ? "" : "Nuestro menú"}
        </span>
      </div>

      {/* THANKS MODE */}
      {mode === "thanks" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
          <div className="text-8xl mb-6">🙌</div>
          <h1 className="text-6xl font-bold text-orange-400 mb-4">¡Gracias!</h1>
          <p className="text-2xl text-gray-300">Tu pedido está siendo preparado</p>
        </div>
      )}

      {/* ORDER MODE */}
      {mode === "order" && (
        <div className="flex-1 flex overflow-hidden">
          {/* Items list */}
          <div className="flex-1 p-8 overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-400 mb-6 uppercase tracking-widest">
              Detalle del pedido
            </h2>
            <div className="space-y-4">
              {cartItems.map((item, i) => (
                <div
                  key={item.variant_id}
                  className="flex items-center justify-between bg-gray-800 rounded-xl px-6 py-4 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-orange-400 w-10 text-center">
                      {item.qty_physical ?? item.qty}x
                    </span>
                    <div>
                      <p className="text-lg font-semibold">{item.product_name}</p>
                      <p className="text-gray-400 text-sm">{item.variant_name}</p>
                      {item.promo_label && (
                        <span className="inline-block bg-red-600 text-white text-xs px-2 py-0.5 rounded-full mt-1">
                          {item.promo_label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {item.discount_applied > 0 && (
                      <p className="text-gray-500 line-through text-sm">
                        Bs {(item.unit_price * (item.qty_physical ?? item.qty)).toFixed(2)}
                      </p>
                    )}
                    <p className="text-xl font-bold text-white">
                      Bs {(item.unit_price * (item.qty_physical ?? item.qty) - item.discount_applied).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total panel */}
          <div className="w-80 bg-gray-900 flex flex-col items-center justify-center p-8 border-l border-gray-800">
            <p className="text-gray-400 uppercase tracking-widest text-sm mb-4">Total a pagar</p>
            <p className="text-6xl font-bold text-orange-400 mb-2">
              Bs {cartTotal.toFixed(2)}
            </p>
            {cartItems.some((i) => i.discount_applied > 0) && (
              <div className="mt-4 bg-green-900 rounded-lg px-4 py-2 text-center">
                <p className="text-green-400 text-sm">Ahorrás</p>
                <p className="text-green-300 font-bold text-lg">
                  Bs {cartItems.reduce((sum, i) => sum + i.discount_applied, 0).toFixed(2)}
                </p>
              </div>
            )}
            <div className="mt-8 text-4xl">{cartItems.length > 0 ? "🛒" : ""}</div>
          </div>
        </div>
      )}

      {/* MENU MODE */}
      {mode === "menu" && (
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          {/* Category tabs */}
          <div className="flex gap-4 mb-6">
            {categories.map((cat) => (
              <div key={cat} className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full">
                <span>{CATEGORY_EMOJI[cat] ?? "🍽️"}</span>
                <span className="text-sm font-medium">{CATEGORY_LABEL[cat] ?? cat}</span>
              </div>
            ))}
          </div>

          {/* Product grid — 6 per page */}
          <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
            {visibleProducts.map((product) => {
              const minPrice = product.product_variants?.length
                ? Math.min(...product.product_variants.map((v) => v.base_price))
                : 0;
              const hasVariants = (product.product_variants?.length ?? 0) > 1;

              return (
                <div
                  key={product.id}
                  className="bg-gray-800 rounded-2xl overflow-hidden flex flex-col transition-all duration-500"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-36 object-cover"
                    />
                  ) : (
                    <div className="w-full h-36 bg-gray-700 flex items-center justify-center text-5xl">
                      {CATEGORY_EMOJI[product.category] ?? "🍽️"}
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-orange-400 font-bold text-lg">
                        {hasVariants ? `Desde Bs ${minPrice}` : `Bs ${minPrice}`}
                      </span>
                      {hasVariants && (
                        <span className="text-xs text-gray-500">varios tamaños</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Page indicator dots */}
          {products.length > 6 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: Math.ceil(products.length / 6) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === menuPage ? "bg-orange-400 w-6" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
