"use client";

import { Table, Button, Space, Tag, Typography, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { ROLE_COLORS, ROLE_LABELS } from "../constants/user.constants";
import type { User, Branch } from "../types/user.types";

const { Title } = Typography;

interface Props {
  users: User[];
  branches: Branch[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export function UsersTable({ users, branches, loading, onCreate, onEdit, onDelete }: Props) {
  const branchName = (id: string | null) =>
    id ? (branches.find((b) => b.id === id)?.name ?? "—") : "—";

  const columns = [
    {
      title: "Nombre",
      dataIndex: "full_name",
      key: "full_name",
      sorter: (a: User, b: User) => a.full_name.localeCompare(b.full_name),
      render: (name: string) => name || "—",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Rol",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={ROLE_COLORS[role] ?? "default"}>{ROLE_LABELS[role] ?? role}</Tag>
      ),
    },
    {
      title: "Sucursal",
      dataIndex: "branch_id",
      key: "branch_id",
      render: (id: string | null) => branchName(id),
    },
    {
      title: "Fecha de creación",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) =>
        new Date(date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_: unknown, record: User) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(record)} />
          <Popconfirm
            title="¿Eliminar usuario?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => onDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="!mb-0">Usuarios</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Nuevo usuario
        </Button>
      </div>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </>
  );
}
