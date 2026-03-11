"use client";

import { useState } from "react";
import { Tag, Typography, Empty, Spin, Button } from "antd";
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f5f5f5" }}>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        {CATEGORY_OPTIONS.map((c) => (
          <Button
            key={c.value}
            type={filterCategory === c.value ? "primary" : "default"}
            size="middle"
            onClick={() => setFilterCategory(c.value)}
            style={filterCategory === c.value ? { background: "#ea580c", borderColor: "#ea580c" } : {}}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Spin size="large" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <Empty description="No hay productos en esta categoría" style={{ marginTop: 60 }} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {filteredProducts.map((product) => {
              const firstVariant = product.product_variants?.[0];
              const price = firstVariant ? getVariantPrice(firstVariant, branchId) : 0;
              const hasMultipleVariants = (product.product_variants?.length ?? 0) > 1;
              const promoLabels = product.product_variants?.map((v) => getPromoLabel(v.id)).filter(Boolean);
              const promoLabel = promoLabels?.[0] ?? null;

              return (
                <div
                  key={product.id}
                  onClick={() => onProductClick(product)}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                    overflow: "hidden",
                    transition: "box-shadow 0.15s, transform 0.1s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Imagen */}
                  <div style={{ position: "relative" }}>
                    {product.image_url ? (
                      <NextImage src={product.image_url} alt={product.name} width={300} height={130} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: 130, background: "linear-gradient(135deg, #fff7ed, #fed7aa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>
                        {product.category === "pizza" ? "🍕" : product.category === "bebida" ? "🥤" : "🍽️"}
                      </div>
                    )}
                    <div style={{ position: "absolute", top: 8, left: 8 }}>
                      <Tag color={CATEGORY_COLORS[product.category]} style={{ margin: 0, fontSize: 11 }}>{product.category}</Tag>
                    </div>
                    {promoLabel && (
                      <div style={{ position: "absolute", top: 8, right: 8 }}>
                        <Tag color="volcano" style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>{promoLabel}</Tag>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "10px 12px" }}>
                    <Text strong style={{ fontSize: 13, display: "block", lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {product.name}
                    </Text>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <Text style={{ color: "#ea580c", fontWeight: 700, fontSize: 14 }}>
                        {hasMultipleVariants ? `Desde Bs ${price}` : `Bs ${price}`}
                      </Text>
                      {hasMultipleVariants && (
                        <Text type="secondary" style={{ fontSize: 11 }}>varios</Text>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
