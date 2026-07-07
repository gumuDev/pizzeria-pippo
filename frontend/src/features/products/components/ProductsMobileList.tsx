"use client";

import { useRouter } from "next/navigation";
import { Button, Tag, Typography } from "antd";
import { EditOutlined, StopOutlined, CheckCircleOutlined, EyeOutlined, DollarOutlined } from "@ant-design/icons";
import { CATEGORY_OPTIONS, CATEGORY_COLORS } from "../constants/product.constants";
import { ProductImage } from "./ProductImage";
import type { Product } from "../types/product.types";

const { Text } = Typography;

interface Props {
  products: Product[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onToggleActive: (record: Product) => void;
}

export function ProductsMobileList({ products, loading, total, page, pageSize, onPageChange, onToggleActive }: Props) {
  const router = useRouter();

  if (loading) {
    return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Cargando...</div>;
  }

  return (
    <>
      <div style={{ marginBottom: 8, color: "#6b7280", fontSize: 13 }}>{total} productos</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, opacity: product.is_active ? 1 : 0.6 }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <ProductImage url={product.image_url} category={product.category} width={56} height={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Text strong style={{ fontSize: 15, textDecoration: product.is_active ? "none" : "line-through" }}>
                    {product.name}
                  </Text>
                  {!product.is_active && <Tag color="default" style={{ margin: 0 }}>Inactivo</Tag>}
                </div>
                <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <Tag color={CATEGORY_COLORS[product.category]} style={{ margin: 0 }}>
                    {CATEGORY_OPTIONS.find((c) => c.value === product.category)?.label ?? product.category}
                  </Tag>
                  <Tag color={product.product_type === "resale" ? "purple" : "orange"} style={{ margin: 0 }}>
                    {product.product_type === "resale" ? "Reventa" : "Elaboración"}
                  </Tag>
                  {product.product_variants?.map((v) => (
                    <Tag key={v.id} style={{ margin: 0 }}>{v.name}</Tag>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <Button size="small" icon={<EyeOutlined />} onClick={() => router.push(`/products/${product.id}`)} style={{ flex: 1 }}>
                  Ver
                </Button>
                <Button size="small" icon={<DollarOutlined />} onClick={() => router.push(`/products/${product.id}/prices`)} style={{ flex: 1 }}>
                  Precios
                </Button>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/products/${product.id}/edit`)} style={{ flex: 1 }}>
                  Editar
                </Button>
                <Button
                  size="small"
                  icon={product.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                  danger={product.is_active}
                  onClick={() => onToggleActive(product)}
                  style={{ flex: 1 }}
                >
                  {product.is_active ? "Desactivar" : "Reactivar"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {total > pageSize && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <Button size="small" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
          <span style={{ lineHeight: "24px", color: "#6b7280", fontSize: 13 }}>Pág. {page} / {Math.ceil(total / pageSize)}</span>
          <Button size="small" disabled={page >= Math.ceil(total / pageSize)} onClick={() => onPageChange(page + 1)}>Siguiente</Button>
        </div>
      )}
    </>
  );
}
