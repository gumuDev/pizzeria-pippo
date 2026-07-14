"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { Table, Button, Space, Tag, Typography, Tooltip, Dropdown, Modal } from "antd";
import {
  EditOutlined, StopOutlined, CheckCircleOutlined, DollarOutlined,
  DeleteOutlined, CopyOutlined, MoreOutlined,
} from "@ant-design/icons";
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
  onDelete: (record: Product) => void;
  onDuplicate: (record: Product) => void;
}

// Detiene la propagación para que los botones de la columna Acciones no
// disparen también el click de la fila (que navega al detalle).
function stopRowClick(e: MouseEvent) {
  e.stopPropagation();
}

export function ProductsDesktopTable({ products, loading, page, pageSize, total, onPageChange, onToggleActive, onDelete, onDuplicate }: Props) {
  const router = useRouter();

  const confirmDelete = (record: Product) => {
    Modal.confirm({
      title: "¿Eliminar este producto?",
      content: "Solo se puede si no tiene ventas ni promociones asociadas. No se puede deshacer.",
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: () => onDelete(record),
    });
  };

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
        <Space onClick={stopRowClick}>
          <Tooltip title="Precios por sucursal">
            <Button icon={<DollarOutlined />} size="small" onClick={() => router.push(`/products/${record.id}/prices`)} />
          </Tooltip>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} size="small" onClick={() => router.push(`/products/${record.id}/edit`)} />
          </Tooltip>
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "toggle",
                  label: record.is_active ? "Desactivar" : "Activar",
                  icon: record.is_active ? <StopOutlined /> : <CheckCircleOutlined />,
                },
                { type: "divider" },
                { key: "delete", label: "Eliminar", icon: <DeleteOutlined />, danger: true },
              ],
              onClick: ({ key }) => {
                if (key === "duplicate") onDuplicate(record);
                else if (key === "toggle") onToggleActive(record);
                else if (key === "delete") confirmDelete(record);
              },
            }}
          >
            <Tooltip title="Más opciones">
              <Button icon={<MoreOutlined />} size="small" />
            </Tooltip>
          </Dropdown>
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
      onRow={(record) => ({
        onClick: () => router.push(`/products/${record.id}`),
        style: { cursor: "pointer" },
      })}
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
