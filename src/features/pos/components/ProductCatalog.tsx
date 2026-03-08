"use client";

import { Button, Tag, Typography, Empty } from "antd";
import { useState } from "react";
import NextImage from "next/image";
import type { Product } from "../types/pos.types";

const { Text } = Typography;

const CATEGORY_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "pizza", label: "Pizza" },
  { value: "bebida", label: "Bebida" },
  { value: "otro", label: "Otro" },
];

const CATEGORY_COLORS: Record<string, string> = {
  pizza: "red",
  bebida: "blue",
  otro: "green",
};

interface Props {
  products: Product[];
  loading: boolean;
  branchId: string;
  getVariantPrice: (variant: Product["product_variants"][0], branchId: string) => number;
  getPromoLabel: (variantId: string) => string | null;
  onProductClick: (product: Product) => void;
}

export function ProductCatalog({ products, loading, branchId, getVariantPrice, getPromoLabel, onProductClick }: Props) {
  const [filterCategory, setFilterCategory] = useState("all");

  const filteredProducts = filterCategory === "all"
    ? products
    : products.filter((p) => p.category === filterCategory);

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="flex gap-2 mb-4">
        {CATEGORY_OPTIONS.map((c) => (
          <Button
            key={c.value}
            type={filterCategory === c.value ? "primary" : "default"}
            size="small"
            onClick={() => setFilterCategory(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Text type="secondary">Cargando productos...</Text>
          </div>
        ) : (
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const firstVariant = product.product_variants?.[0];
              const price = firstVariant ? getVariantPrice(firstVariant, branchId) : 0;
              const hasMultipleVariants = (product.product_variants?.length ?? 0) > 1;
              const promoLabels = product.product_variants?.map((v) => getPromoLabel(v.id)).filter(Boolean);
              const promoLabel = promoLabels?.[0] ?? null;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:border-orange-300 border-2 border-transparent transition-all overflow-hidden"
                  onClick={() => onProductClick(product)}
                >
                  <div className="relative">
                    {product.image_url ? (
                      <NextImage src={product.image_url} alt={product.name} width={300} height={112} className="w-full h-28 object-cover" />
                    ) : (
                      <div className="w-full h-28 bg-orange-50 flex items-center justify-center text-3xl">
                        {product.category === "pizza" ? "🍕" : product.category === "bebida" ? "🥤" : "🍽️"}
                      </div>
                    )}
                    {promoLabel && (
                      <div className="absolute top-1 right-1">
                        <Tag color="red" className="!m-0 text-xs font-bold">{promoLabel}</Tag>
                      </div>
                    )}
                    <div className="absolute top-1 left-1">
                      <Tag color={CATEGORY_COLORS[product.category]} className="!m-0 text-xs">
                        {product.category}
                      </Tag>
                    </div>
                  </div>
                  <div className="p-2">
                    <Text strong className="text-sm block leading-tight">{product.name}</Text>
                    <div className="flex justify-between items-center mt-1">
                      <Text className="text-orange-600 font-bold">
                        {hasMultipleVariants ? `Desde Bs ${price}` : `Bs ${price}`}
                      </Text>
                      {hasMultipleVariants && (
                        <Text type="secondary" className="text-xs">varios tamaños</Text>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loading && filteredProducts.length === 0 && (
          <Empty description="No hay productos en esta categoría" />
        )}
      </div>
    </div>
  );
}
