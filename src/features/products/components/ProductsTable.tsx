"use client";

import { useRouter } from "next/navigation";
import { Table, Button, Space, Tag, Typography, Switch, Tooltip } from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, EyeOutlined,
} from "@ant-design/icons";
import { CATEGORY_OPTIONS, CATEGORY_COLORS } from "../constants/product.constants";
import { ProductImage } from "./ProductImage";
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

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!mb-0">Productos</Title>
        <Space>
          <Space>
            <EyeOutlined style={{ color: "#6b7280" }} />
            <Text type="secondary">Ver inactivos</Text>
            <Switch size="small" checked={showInactive} onChange={onToggleInactive} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Nuevo producto
          </Button>
        </Space>
      </div>

      <Space className="mb-4">
        <Text>Filtrar:</Text>
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
      </Space>

      <Table dataSource={products} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    </>
  );
}
