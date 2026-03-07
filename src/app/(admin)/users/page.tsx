"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  Typography,
  Tag,
  notification,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

const { Title } = Typography;

interface Branch {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "cajero" | "cocinero";
  branch_id: string | null;
  created_at: string;
}

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export default function UsersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "cajero" | "cocinero">("cajero");
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    const res = await fetch("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  }, []);

  const fetchBranches = useCallback(async () => {
    const token = await getToken();
    const res = await fetch("/api/branches", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setBranches(data);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [fetchUsers, fetchBranches]);

  const openCreate = () => {
    setEditing(null);
    setSelectedRole("cajero");
    form.resetFields();
    form.setFieldsValue({ role: "cajero" });
    setModalOpen(true);
  };

  const openEdit = (record: User) => {
    setEditing(record);
    setSelectedRole(record.role);
    form.setFieldsValue({
      full_name: record.full_name,
      role: record.role,
      branch_id: record.branch_id,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values: {
    full_name: string;
    email?: string;
    password?: string;
    role: "admin" | "cajero" | "cocinero";
    branch_id?: string | null;
  }) => {
    setSaving(true);
    const token = await getToken();

    const url = editing ? `/api/users/${editing.id}` : "/api/users";
    const method = editing ? "PUT" : "POST";

    const body = editing
      ? { full_name: values.full_name, role: values.role, branch_id: values.branch_id ?? null }
      : {
          email: values.email,
          password: values.password,
          full_name: values.full_name,
          role: values.role,
          branch_id: values.branch_id ?? null,
        };

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchUsers();
      notification.success({
        message: editing ? "Usuario actualizado" : "Usuario creado",
      });
    } else {
      const { error } = await res.json();
      notification.error({ message: error ?? "Error al guardar" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      fetchUsers();
      notification.success({ message: "Usuario eliminado" });
    } else {
      const { error } = await res.json();
      notification.error({ message: error ?? "Error al eliminar" });
    }
  };

  const branchName = (id: string | null) => {
    if (!id) return "—";
    return branches.find((b) => b.id === id)?.name ?? "—";
  };

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
      render: (role: string) =>
        role === "admin" ? (
          <Tag color="blue">Admin</Tag>
        ) : role === "cocinero" ? (
          <Tag color="orange">Cocinero</Tag>
        ) : (
          <Tag color="green">Cajero</Tag>
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
        new Date(date).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="¿Eliminar usuario?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleDelete(record.id)}
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="!mb-0">Usuarios</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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

      <Modal
        title={editing ? "Editar usuario" : "Nuevo usuario"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            label="Nombre completo"
            name="full_name"
            rules={[{ required: true, message: "Ingresá el nombre del usuario" }]}
          >
            <Input placeholder="Ej: Juan Pérez" />
          </Form.Item>

          {!editing && (
            <>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Ingresá el email" },
                  { type: "email", message: "Email inválido" },
                ]}
              >
                <Input placeholder="usuario@ejemplo.com" />
              </Form.Item>

              <Form.Item
                label="Contraseña"
                name="password"
                rules={[
                  { required: true, message: "Ingresá la contraseña" },
                  { min: 6, message: "Mínimo 6 caracteres" },
                ]}
              >
                <Input.Password placeholder="Mínimo 6 caracteres" />
              </Form.Item>
            </>
          )}

          <Form.Item
            label="Rol"
            name="role"
            rules={[{ required: true, message: "Seleccioná un rol" }]}
          >
            <Select
              options={[
                { value: "cajero", label: "Cajero" },
                { value: "cocinero", label: "Cocinero" },
                { value: "admin", label: "Admin" },
              ]}
              onChange={(value) => {
                setSelectedRole(value);
                if (value === "admin") {
                  form.setFieldValue("branch_id", null);
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="Sucursal"
            name="branch_id"
            rules={[
              {
                required: selectedRole === "cajero" || selectedRole === "cocinero",
                message: "Seleccioná la sucursal",
              },
            ]}
          >
            <Select
              disabled={selectedRole === "admin"}
              placeholder="Seleccioná una sucursal"
              allowClear
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editing ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
