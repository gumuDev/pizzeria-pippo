"use client";

import { Table, Button, Space, Tag, Typography, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { ROLE_COLORS, ROLE_LABELS } from "../constants/user.constants";
import { useIsMobile } from "@/lib/useIsMobile";
import type { User, Branch } from "../types/user.types";

const { Title, Text } = Typography;

interface Props {
  users: User[];
  branches: Branch[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export function UsersTable({ users, branches, loading, onCreate, onEdit, onDelete }: Props) {
  const isMobile = useIsMobile();
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
    { title: "Email", dataIndex: "email", key: "email" },
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

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
      <Title level={4} style={{ margin: 0 }}>Usuarios</Title>
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        {isMobile ? "Nuevo" : "Nuevo usuario"}
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
            {users.map((user) => (
              <div
                key={user.id}
                style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 15, display: "block" }}>{user.full_name || "—"}</Text>
                    <Text type="secondary" style={{ fontSize: 13, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.email}
                    </Text>
                    <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <Tag color={ROLE_COLORS[user.role] ?? "default"} style={{ margin: 0 }}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Tag>
                      {user.branch_id && (
                        <Tag style={{ margin: 0 }}>{branchName(user.branch_id)}</Tag>
                      )}
                    </div>
                  </div>
                  <Space size={6}>
                    <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(user)} />
                    <Popconfirm
                      title="¿Eliminar usuario?"
                      description="Esta acción no se puede deshacer."
                      onConfirm={() => onDelete(user.id)}
                      okText="Eliminar"
                      cancelText="Cancelar"
                      okButtonProps={{ danger: true }}
                    >
                      <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {header}
      <Table dataSource={users} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    </>
  );
}
