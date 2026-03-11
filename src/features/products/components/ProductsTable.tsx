"use client";

import { useRouter } from "next/navigation";
import { Table, Button, Space, Tag, Typography, Switch, Tooltip } from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, EyeOutlined,
} from "@ant-design/icons";
import { CATEGORY_OPTIONS, CATEGORY_COLORS } from "../constants/product.constants";
import { ProductImage } from "./ProductImage";
import { useIsMobile } from "@/lib/useIsMobile";
import type { Product } from "../types/product.types";

const { Title, Text } = Typography;

interface Props {
  products: Product[];
  loading: boolean;
  showInactive: boolean;
  onToggleInactive: (val: boolean) => void;
  filterCategory: string | null;
  onFilterCategory: (cat: string | null) => void;
  onCreate: () => void;
  onEdit: (record: Product) => void;
  onToggleActive: (record: Product) => void;
}

export function ProductsTable({
  products, loading, showInactive, onToggleInactive,
  filterCategory, onFilterCategory, onCreate, onEdit, onToggleActive,
}: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const columns = [
    {
      title: "Imagen",
      key: "image_url",
      width: 72,
      render: (_: unknown, record: Product) => (
        <ProductImage url={record.image_url} category={record.category} />
      ),
    },
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Product) => (
        <Space>
          <Text delete={!record.is_active} style={!record.is_active ? { color: "#9ca3af" } : {}}>
            {name}
          </Text>
          {!record.is_active && <Tag color="default">Inactivo</Tag>}
        </Space>
      ),
    },
    {
      title: "Categoría",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => (
        <Tag color={CATEGORY_COLORS[cat]}>{CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat}</Tag>
      ),
    },
    {
      title: "Variantes",
      key: "variants",
      render: (_: unknown, record: Product) => (
        <Space>
          {record.product_variants?.map((v) => (
            <Tag key={v.id}>{v.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Product) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button icon={<EyeOutlined />} size="small" onClick={() => router.push(`/products/${record.id}`)} />
          </Tooltip>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title={record.is_active ? "Desactivar" : "Reactivar"}>
            <Button
              icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
              size="small"
              danger={record.is_active}
              onClick={() => onToggleActive(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
      <Title level={4} style={{ margin: 0 }}>Productos</Title>
      <Space wrap>
        <Space size={4}>
          <EyeOutlined style={{ color: "#6b7280" }} />
          {!isMobile && <Text type="secondary">Ver inactivos</Text>}
          <Switch size="small" checked={showInactive} onChange={onToggleInactive} />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          {isMobile ? "Nuevo" : "Nuevo producto"}
        </Button>
      </Space>
    </div>
  );

  const filters = (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
      {!isMobile && <Text style={{ lineHeight: "24px" }}>Filtrar:</Text>}
      <Button size="small" type={!filterCategory ? "primary" : "default"} onClick={() => onFilterCategory(null)}>Todos</Button>
      {CATEGORY_OPTIONS.map((c) => (
        <Button
          key={c.value}
          size="small"
          type={filterCategory === c.value ? "primary" : "default"}
          onClick={() => onFilterCategory(c.value)}
        >
          {c.label}
        </Button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {header}
        {filters}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Cargando...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 14,
                  opacity: product.is_active ? 1 : 0.6,
                }}
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
                      {product.product_variants?.map((v) => (
                        <Tag key={v.id} style={{ margin: 0 }}>{v.name}</Tag>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 10 }}>
                  <Button size="small" icon={<EyeOutlined />} onClick={() => router.push(`/products/${product.id}`)} style={{ flex: 1 }}>
                    Ver
                  </Button>
                  <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(product)} style={{ flex: 1 }}>
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
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {header}
      {filters}
      <Table dataSource={products} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    </>
  );
}
