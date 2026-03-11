"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Row, Col, Card, Tag, Typography, Space, Button,
  Table, Divider, Skeleton, Badge,
} from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/lib/useIsMobile";

const { Title, Text } = Typography;

const CATEGORY_COLORS: Record<string, string> = {
  pizza: "red", bebida: "blue", otro: "green",
};
const CATEGORY_BG: Record<string, string> = {
  pizza: "#fef2f2", bebida: "#eff6ff", otro: "#f0fdf4",
};
const CATEGORY_EMOJI: Record<string, string> = {
  pizza: "🍕", bebida: "🥤", otro: "🍽️",
};

function CategoryPlaceholder({ category, size = 220 }: { category: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: CATEGORY_BG[category] ?? "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: size * 0.35, lineHeight: 1 }}>{CATEGORY_EMOJI[category] ?? "🍽️"}</span>
    </div>
  );
}

interface RecipeItem {
  ingredient_id: string;
  quantity: number;
  apply_condition?: string;
  ingredients: { name: string; unit: string };
}

interface BranchPrice {
  branch_id: string;
  price: number;
  branches?: { name: string };
}

interface Variant {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
  branch_prices: BranchPrice[];
  recipes: RecipeItem[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  is_active: boolean;
  product_variants: Variant[];
}

const CONDITION_LABELS: Record<string, string> = {
  always: "Siempre",
  takeaway: "Solo llevar",
  dine_in: "Solo local",
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select(`*, product_variants (*, branch_prices (*, branches(name)), recipes (*, ingredients(name, unit)))`)
        .eq("id", id)
        .single();
      if (data) setProduct(data);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 24 }}><Skeleton active paragraph={{ rows: 8 }} /></div>;
  }

  if (!product) {
    return <div style={{ padding: 24 }}><Text type="danger">Producto no encontrado.</Text></div>;
  }

  const recipeColumns = [
    { title: "Insumo", key: "name", render: (_: unknown, r: RecipeItem) => <Text>{r.ingredients?.name}</Text> },
    { title: "Unidad", key: "unit", render: (_: unknown, r: RecipeItem) => <Tag>{r.ingredients?.unit}</Tag> },
    { title: "Cantidad", dataIndex: "quantity", key: "quantity", render: (q: number) => <Text strong>{q}</Text> },
    {
      title: "Condición",
      key: "condition",
      render: (_: unknown, r: RecipeItem) => (
        <Tag color={r.apply_condition === "takeaway" ? "blue" : r.apply_condition === "dine_in" ? "orange" : "default"}>
          {CONDITION_LABELS[r.apply_condition ?? "always"] ?? r.apply_condition}
        </Tag>
      ),
    },
  ];

  const imgSize = isMobile ? 140 : 220;

  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 20 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/products")}>Volver</Button>
          <Title level={4} style={{ margin: 0 }}>{product.name}</Title>
          {!product.is_active && <Tag color="default">Inactivo</Tag>}
        </Space>
        <Button icon={<EditOutlined />} type="primary" onClick={() => router.push("/products")}>
          Editar
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {/* Left — imagen + info general */}
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={imgSize}
                  height={imgSize}
                  style={{ borderRadius: 12, objectFit: "cover" }}
                />
              ) : (
                <CategoryPlaceholder category={product.category} size={imgSize} />
              )}
              <div style={{ textAlign: "center" }}>
                <Title level={3} style={{ margin: 0 }}>{product.name}</Title>
                <Space style={{ marginTop: 8 }}>
                  <Tag color={CATEGORY_COLORS[product.category] ?? "default"} style={{ fontSize: 13 }}>
                    {product.category}
                  </Tag>
                  {product.is_active
                    ? <Badge status="success" text="Activo" />
                    : <Badge status="default" text="Inactivo" />}
                </Space>
              </div>
            </div>
            {product.description && (
              <>
                <Divider />
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                    Descripción para el cliente
                  </Text>
                  <Text>{product.description}</Text>
                </div>
              </>
            )}
          </Card>
        </Col>

        {/* Right — variantes */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            {product.product_variants?.map((variant) => (
              <Card
                key={variant.id}
                size="small"
                title={
                  <Space>
                    <Text strong style={{ fontSize: 15 }}>{variant.name}</Text>
                    {!variant.is_active && <Tag color="default">Inactiva</Tag>}
                  </Space>
                }
                extra={
                  <Space wrap>
                    {variant.branch_prices?.length > 0
                      ? variant.branch_prices.map((bp) => (
                          <Tag key={bp.branch_id} color="orange">
                            {bp.branches?.name}: Bs {Number(bp.price).toFixed(2)}
                          </Tag>
                        ))
                      : <Tag color="orange">Bs {Number(variant.base_price).toFixed(2)}</Tag>
                    }
                  </Space>
                }
                style={!variant.is_active ? { opacity: 0.6 } : {}}
              >
                {variant.recipes?.length > 0 ? (
                  <>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                      Receta interna
                    </Text>
                    {isMobile ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {variant.recipes.map((r) => (
                          <div key={r.ingredient_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#f9fafb", borderRadius: 8 }}>
                            <div>
                              <Text strong style={{ fontSize: 13 }}>{r.ingredients?.name}</Text>
                              <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>({r.ingredients?.unit})</Text>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Text strong>{r.quantity}</Text>
                              <Tag color={r.apply_condition === "takeaway" ? "blue" : r.apply_condition === "dine_in" ? "orange" : "default"} style={{ margin: 0, fontSize: 11 }}>
                                {CONDITION_LABELS[r.apply_condition ?? "always"]}
                              </Tag>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Table
                        dataSource={variant.recipes}
                        columns={recipeColumns}
                        rowKey="ingredient_id"
                        pagination={false}
                        size="small"
                      />
                    )}
                  </>
                ) : (
                  <Text type="secondary">Sin receta registrada</Text>
                )}
              </Card>
            ))}
          </Space>
        </Col>
      </Row>
    </div>
  );
}
