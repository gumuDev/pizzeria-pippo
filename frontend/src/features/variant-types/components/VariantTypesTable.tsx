"use client";

import { Table, Button, Tag, Space, Typography } from "antd";
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useIsMobile } from "@/lib/useIsMobile";
import type { VariantType } from "../types/variant-type.types";

const { Title, Text } = Typography;

interface Props {
  variantTypes: VariantType[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (record: VariantType) => void;
  onToggle: (record: VariantType) => void;
}

export function VariantTypesTable({ variantTypes, loading, onCreate, onEdit, onToggle }: Props) {
  const isMobile = useIsMobile();

  const columns = [
    { title: "Nombre", dataIndex: "name", key: "name" },
    { title: "Orden", dataIndex: "sort_order", key: "sort_order", width: 80 },
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
          <Button size="small" danger={record.is_active} onClick={() => onToggle(record)}>
            {record.is_active ? "Desactivar" : "Activar"}
          </Button>
        </Space>
      ),
    },
  ];

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
      <Title level={4} style={{ margin: 0 }}>Tipos de Variante</Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        Nuevo tipo
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {header}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Cargando...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {variantTypes.map((vt) => (
              <div
                key={vt.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <Text strong style={{ fontSize: 15 }}>{vt.name}</Text>
                  <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                    <Tag style={{ margin: 0 }}>Orden: {vt.sort_order}</Tag>
                    {vt.is_active
                      ? <Tag color="green" style={{ margin: 0 }}>Activo</Tag>
                      : <Tag color="default" style={{ margin: 0 }}>Inactivo</Tag>}
                  </div>
                </div>
                <Space size={6}>
                  <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(vt)} />
                  <Button
                    icon={vt.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                    size="small"
                    danger={vt.is_active}
                    onClick={() => onToggle(vt)}
                  />
                </Space>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      {header}
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
