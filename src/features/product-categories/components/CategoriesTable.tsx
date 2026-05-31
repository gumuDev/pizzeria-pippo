"use client";

import { Table, Tag, Button, Space, Popconfirm, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ProductCategory } from "../types/product-category.types";

interface Props {
  categories: ProductCategory[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (cat: ProductCategory) => void;
  onDelete: (id: string) => void;
}

export function CategoriesTable({ categories, loading, onCreate, onEdit, onDelete }: Props) {
  const columns = [
    {
      title: "Nombre",
      key: "name",
      render: (_: unknown, cat: ProductCategory) => (
        <Space>
          <Tag>{cat.name}</Tag>
          {cat.allow_mixing && (
            <Tooltip title="Permite productos mixtos (mitad/mitad)">
              <Tag color="purple">Mixto</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_: unknown, cat: ProductCategory) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(cat)} />
          <Popconfirm
            title="¿Eliminar categoría?"
            description="Los productos con esta categoría quedarán sin categoría válida."
            onConfirm={() => onDelete(cat.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Nueva categoría
        </Button>
      </div>
      <Table
        dataSource={categories}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />
    </div>
  );
}
