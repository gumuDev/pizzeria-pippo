"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Row, Col, Card, Tag, Typography, Space, Button,
  Table, Divider, Skeleton, Badge,
} from "antd";
import {
  ArrowLeftOutlined, EditOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;

const CATEGORY_COLORS: Record<string, string> = {
  pizza: "red",
  bebida: "blue",
  otro: "green",
};

const CATEGORY_BG: Record<string, string> = {
  pizza: "#fef2f2",
  bebida: "#eff6ff",
  otro: "#f0fdf4",
};

const CATEGORY_ICON_COLOR: Record<string, string> = {
  pizza: "#f97316",
  bebida: "#3b82f6",
  otro: "#22c55e",
};

const CATEGORY_EMOJI: Record<string, string> = {
  pizza: "🍕",
  bebida: "🥤",
  otro: "🍽️",
};

function CategoryPlaceholder({ category, size = 220 }: { category: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      background: CATEGORY_BG[category] ?? "#f3f4f6",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontSize: size * 0.35, lineHeight: 1 }}>
        {CATEGORY_EMOJI[category] ?? "🍽️"}
      </span>
    </div>
  );
}

interface RecipeItem {
  ingredient_id: string;
  quantity: number;
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

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select(`
          *,
          product_variants (
            *,
            branch_prices (*, branches(name)),
            recipes (*, ingredients(name, unit))
          )
        `)
        .eq("id", id)
        .single();
      if (data) setProduct(data);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <Text type="danger">Producto no encontrado.</Text>
      </div>
    );
  }

  const recipeColumns = [
    {
      title: "Insumo",
      key: "name",
      render: (_: unknown, r: RecipeItem) => <Text>{r.ingredients?.name}</Text>,
    },
    {
      title: "Unidad",
      key: "unit",
      render: (_: unknown, r: RecipeItem) => <Tag>{r.ingredients?.unit}</Tag>,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      render: (q: number) => <Text strong>{q}</Text>,
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/products")}>
            Volver
          </Button>
          <Title level={4} style={{ margin: 0 }}>{product.name}</Title>
          {!product.is_active && <Tag color="default">Inactivo</Tag>}
        </Space>
        <Button
          icon={<EditOutlined />}
          type="primary"
          onClick={() => router.push("/products")}
        >
          Editar
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left — imagen + info general */}
        <Col xs={24} lg={8}>
          <Card>
            <div className="flex flex-col items-center gap-4">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={220}
                  height={220}
                  style={{ borderRadius: 12, objectFit: "cover" }}
                />
              ) : (
                <CategoryPlaceholder category={product.category} />
              )}

              <div className="text-center">
                <Title level={3} style={{ margin: 0 }}>{product.name}</Title>
                <Space style={{ marginTop: 8 }}>
                  <Tag color={CATEGORY_COLORS[product.category] ?? "default"} style={{ fontSize: 13 }}>
                    {product.category}
                  </Tag>
                  {product.is_active
                    ? <Badge status="success" text="Activo" />
                    : <Badge status="default" text="Inactivo" />
                  }
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

        {/* Right — variantes con precios y recetas */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
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
                  <Space>
                    {variant.branch_prices?.length > 0
                      ? variant.branch_prices.map((bp) => (
                          <Tag key={bp.branch_id} color="orange">
                            {bp.branches?.name}: Bs {Number(bp.price).toFixed(2)}
                          </Tag>
                        ))
                      : (
                          <Tag color="orange">
                            Bs {Number(variant.base_price).toFixed(2)}
                          </Tag>
                        )
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
                    <Table
                      dataSource={variant.recipes}
                      columns={recipeColumns}
                      rowKey="ingredient_id"
                      pagination={false}
                      size="small"
                    />
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
