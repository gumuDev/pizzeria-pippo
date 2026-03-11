"use client";

import { Table, Button, Tag, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { VariantType } from "../types/variant-type.types";

interface Props {
  variantTypes: VariantType[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (record: VariantType) => void;
  onToggle: (record: VariantType) => void;
}

export function VariantTypesTable({ variantTypes, loading, onCreate, onEdit, onToggle }: Props) {
  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Orden",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 80,
    },
    {
      title: "Estado",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      render: (active: boolean) =>
        active ? <Tag color="green">Activo</Tag> : <Tag color="default">Inactivo</Tag>,
    },
    {
      title: "Acciones",
      key: "actions",
      width: 160,
      render: (_: unknown, record: VariantType) => (
        <Space>
          <Button size="small" onClick={() => onEdit(record)}>Editar</Button>
          <Button
            size="small"
            danger={record.is_active}
            onClick={() => onToggle(record)}
          >
            {record.is_active ? "Desactivar" : "Activar"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold m-0">Tipos de Variante</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Nuevo tipo
        </Button>
      </div>
      <Table
        dataSource={variantTypes}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={false}
      />
    </div>
  );
}
