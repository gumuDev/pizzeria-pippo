"use client";

import { Table, Button, Tag, Space, Popconfirm, Switch, Typography } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { AuthorizedChat } from "@/features/telegram-bot/types";
import { UsageIndicator } from "./UsageIndicator";

const { Text } = Typography;

const PLAN_COLORS: Record<string, string> = {
  basic: "default",
  pro: "blue",
  unlimited: "gold",
};

const PLAN_LABELS: Record<string, string> = {
  basic: "Básico",
  pro: "Pro",
  unlimited: "Sin límite",
};

interface Props {
  chats: AuthorizedChat[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (chat: AuthorizedChat) => void;
  onToggleActive: (chat: AuthorizedChat) => void;
  onDelete: (id: string) => void;
}

export function AuthorizedChatsTable({ chats, loading, onCreate, onEdit, onToggleActive, onDelete }: Props) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>Chats autorizados</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Agregar chat
        </Button>
      </div>

      <Table
        dataSource={chats}
        loading={loading}
        rowKey="id"
        size="small"
        pagination={false}
        columns={[
          {
            title: "Nombre",
            dataIndex: "label",
            render: (label: string, row: AuthorizedChat) => (
              <div>
                <div>{label}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>{row.chat_id}</Text>
              </div>
            ),
          },
          {
            title: "Tipo",
            dataIndex: "type",
            width: 90,
            render: (type: string) => (
              <Tag>{type === "group" ? "Grupo" : "Personal"}</Tag>
            ),
          },
          {
            title: "Plan",
            dataIndex: "plan",
            width: 110,
            render: (plan: string) => (
              <Tag color={PLAN_COLORS[plan]}>{PLAN_LABELS[plan]}</Tag>
            ),
          },
          {
            title: "Uso hoy",
            width: 110,
            render: (_: unknown, row: AuthorizedChat) => <UsageIndicator chat={row} />,
          },
          {
            title: "Activo",
            dataIndex: "is_active",
            width: 80,
            render: (_: unknown, row: AuthorizedChat) => (
              <Switch checked={row.is_active} size="small" onChange={() => onToggleActive(row)} />
            ),
          },
          {
            title: "Acciones",
            width: 100,
            render: (_: unknown, row: AuthorizedChat) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(row)} />
                <Popconfirm
                  title="¿Revocar acceso de este chat?"
                  onConfirm={() => onDelete(row.id)}
                  okText="Revocar"
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
