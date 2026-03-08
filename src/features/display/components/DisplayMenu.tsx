"use client";

import NextImage from "next/image";
import type { DisplayProduct } from "../types/display.types";

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

interface Props {
  products: DisplayProduct[];
  menuPage: number;
}

export function DisplayMenu({ products, menuPage }: Props) {
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const visibleProducts = products.slice(menuPage * 6, menuPage * 6 + 6);

  return (
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
                <NextImage
                  src={product.image_url}
                  alt={product.name}
                  width={400}
                  height={144}
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
  );
}
