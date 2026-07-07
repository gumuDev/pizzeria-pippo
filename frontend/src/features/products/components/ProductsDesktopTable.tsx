"use client";

import { useRouter } from "next/navigation";
import { Table, Button, Space, Tag, Typography, Tooltip } from "antd";
import { EditOutlined, StopOutlined, CheckCircleOutlined, EyeOutlined, DollarOutlined } from "@ant-design/icons";
import { CATEGORY_OPTIONS, CATEGORY_COLORS } from "../constants/product.constants";
import { ProductImage } from "./ProductImage";
import type { Product } from "../types/product.types";

const { Text } = Typography;

interface Props {
  products: Product[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onToggleActive: (record: Product) => void;
}

export function ProductsDesktopTable({ products, loading, page, pageSize, total, onPageChange, onToggleActive }: Props) {
  const router = useRouter();

  const columns = [
    {
      title: "Imagen",
      key: "image_url",
      width: 72,
      render: (_: unknown, record: Product) => <ProductImage url={record.image_url} category={record.category} />,
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
      title: "Tipo",
      dataIndex: "product_type",
      key: "product_type",
      render: (type: string) => (
        <Tag color={type === "resale" ? "purple" : "orange"}>{type === "resale" ? "Reventa" : "Elaboración"}</Tag>
      ),
    },
    {
      title: "Variantes",
      key: "variants",
      render: (_: unknown, record: Product) => (
        <Space>
          {record.product_variants?.map((v) => <Tag key={v.id}>{v.name}</Tag>)}
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
          <Tooltip title="Precios por sucursal">
            <Button icon={<DollarOutlined />} size="small" onClick={() => router.push(`/products/${record.id}/prices`)} />
          </Tooltip>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} size="small" onClick={() => router.push(`/products/${record.id}/edit`)} />
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
    <Table
      dataSource={products}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        showTotal: (t) => `${t} productos`,
        onChange: onPageChange,
      }}
    />
  );
}
