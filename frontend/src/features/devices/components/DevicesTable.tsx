"use client";

import { Table, Button, Tag, Space, Switch, Typography, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { Branch } from "@/features/branches/types/branch.types";
import type { Device } from "../types/device.types";

const { Text } = Typography;

interface Props {
  devices: Device[];
  branches: Branch[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (device: Device) => void;
  onToggleActive: (device: Device) => void;
  onDelete: (device: Device) => void;
}

export function DevicesTable({ devices, branches, loading, onCreate, onEdit, onToggleActive, onDelete }: Props) {
  const branchName = (branchId: string) => branches.find((b) => b.id === branchId)?.name ?? "—";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>Dispositivos</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Agregar dispositivo
        </Button>
      </div>

      <Table
        dataSource={devices}
        loading={loading}
        rowKey="id"
        size="small"
        pagination={false}
        columns={[
          {
            title: "Nombre",
            dataIndex: "name",
          },
          {
            title: "Sucursal",
            dataIndex: "branch_id",
            render: (branchId: string) => branchName(branchId),
          },
          {
            title: "Última conexión",
            dataIndex: "last_seen_at",
            render: (lastSeenAt: string | null) =>
              lastSeenAt ? (
                <Text type="secondary">{new Date(lastSeenAt).toLocaleString("es-BO")}</Text>
              ) : (
                <Tag>Nunca</Tag>
              ),
          },
          {
            title: "Activo",
            dataIndex: "is_active",
            width: 80,
            render: (_: unknown, row: Device) => (
              <Switch checked={row.is_active} size="small" onChange={() => onToggleActive(row)} />
            ),
          },
          {
            title: "Acciones",
            width: 100,
            render: (_: unknown, row: Device) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(row)} />
                <Popconfirm
                  title="¿Eliminar este dispositivo?"
                  description="Podrás reactivarlo después desde el switch."
                  onConfirm={() => onDelete(row)}
                  okText="Eliminar"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
