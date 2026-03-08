"use client";

import type { DisplayCartItem } from "../types/display.types";

interface Props {
  cartItems: DisplayCartItem[];
  cartTotal: number;
}

export function DisplayCart({ cartItems, cartTotal }: Props) {
  return (
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
  );
}
