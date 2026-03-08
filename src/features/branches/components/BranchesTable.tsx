"use client";

import { Table, Button, Space, Tag, Typography, Tooltip, Switch } from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, EyeOutlined,
} from "@ant-design/icons";
import type { Branch } from "../types/branch.types";

const { Title, Text } = Typography;

interface Props {
  branches: Branch[];
  loading: boolean;
  showInactive: boolean;
  onToggleInactive: (val: boolean) => void;
  onCreate: () => void;
  onEdit: (branch: Branch) => void;
  onToggleActive: (branch: Branch) => void;
}

export function BranchesTable({ branches, loading, showInactive, onToggleInactive, onCreate, onEdit, onToggleActive }: Props) {
  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Branch) => (
        <Space>
          <Text delete={!record.is_active} style={!record.is_active ? { color: "#9ca3af" } : {}}>
            {name}
          </Text>
          {!record.is_active && <Tag color="default">Inactiva</Tag>}
        </Space>
      ),
    },
    {
      title: "Dirección",
      dataIndex: "address",
      key: "address",
      render: (address: string | null, record: Branch) => (
        <Text style={!record.is_active ? { color: "#9ca3af" } : {}}>
          {address ?? "—"}
        </Text>
      ),
    },
    {
      title: "Fecha de creación",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string, record: Branch) => (
        <Text style={!record.is_active ? { color: "#9ca3af" } : {}}>
          {new Date(date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </Text>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Branch) => (
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
        <Title level={4} className="!mb-0">Sucursales</Title>
        <Space>
          <Space>
            <EyeOutlined style={{ color: "#6b7280" }} />
            <Text type="secondary">Ver inactivas</Text>
            <Switch size="small" checked={showInactive} onChange={onToggleInactive} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Nueva sucursal
          </Button>
        </Space>
      </div>
      <Table
        dataSource={branches}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        rowClassName={(r) => (!r.is_active ? "opacity-60" : "")}
      />
    </>
  );
}
