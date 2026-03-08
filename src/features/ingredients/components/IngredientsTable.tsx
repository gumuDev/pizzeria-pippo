"use client";

import { Table, Button, Space, Tag, Typography, Tooltip, Switch } from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, EyeOutlined,
} from "@ant-design/icons";
import { UNIT_OPTIONS, UNIT_COLORS } from "../constants/ingredient.constants";
import type { Ingredient } from "../types/ingredient.types";

const { Title, Text } = Typography;

interface Props {
  ingredients: Ingredient[];
  loading: boolean;
  showInactive: boolean;
  onToggleInactive: (val: boolean) => void;
  onCreate: () => void;
  onEdit: (ingredient: Ingredient) => void;
  onToggleActive: (ingredient: Ingredient) => void;
}

export function IngredientsTable({ ingredients, loading, showInactive, onToggleInactive, onCreate, onEdit, onToggleActive }: Props) {
  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Ingredient) => (
        <Space>
          <Text delete={!record.is_active} style={!record.is_active ? { color: "#9ca3af" } : {}}>
            {name}
          </Text>
          {!record.is_active && <Tag color="default">Inactivo</Tag>}
        </Space>
      ),
    },
    {
      title: "Unidad",
      dataIndex: "unit",
      key: "unit",
      render: (unit: string, record: Ingredient) => (
        <Tag color={record.is_active ? (UNIT_COLORS[unit] ?? "default") : "default"}>
          {UNIT_OPTIONS.find((u) => u.value === unit)?.label ?? unit}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Ingredient) => (
        <Space>
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
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="!mb-0">Insumos</Title>
        <Space>
          <Space>
            <EyeOutlined style={{ color: "#6b7280" }} />
            <Text type="secondary">Ver inactivos</Text>
            <Switch size="small" checked={showInactive} onChange={onToggleInactive} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Nuevo insumo
          </Button>
        </Space>
      </div>
      <Table
        dataSource={ingredients}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        rowClassName={(r) => (!r.is_active ? "opacity-60" : "")}
      />
    </>
  );
}
