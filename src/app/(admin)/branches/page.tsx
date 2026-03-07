"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table, Button, Modal, Form, Input, Space,
  Typography, notification, Switch, Tag, Tooltip,
} from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, EyeOutlined,
} from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;

interface Branch {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  is_active: boolean;
}

interface Cashier {
  id: string;
  full_name: string;
}

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export default function BranchesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [blockModal, setBlockModal] = useState<{ branch: Branch; cashiers: Cashier[] } | null>(null);
  const [form] = Form.useForm();

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    const res = await fetch(`/api/branches${showInactive ? "?showInactive=true" : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setBranches(await res.json());
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Branch) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name, address: record.address ?? "" });
    setModalOpen(true);
  };

  const handleSubmit = async (values: { name: string; address?: string }) => {
    setSaving(true);
    const token = await getToken();
    const url = editing ? `/api/branches/${editing.id}` : "/api/branches";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchBranches();
      notification.success({ message: editing ? "Sucursal actualizada" : "Sucursal creada" });
    } else {
      const { error } = await res.json();
      notification.error({ message: error ?? "Error al guardar" });
    }
    setSaving(false);
  };

  const handleToggleActive = async (branch: Branch) => {
    const token = await getToken();
    const res = await fetch(`/api/branches/${branch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !branch.is_active }),
    });

    if (res.ok) {
      fetchBranches();
      notification.success({ message: branch.is_active ? "Sucursal desactivada" : "Sucursal reactivada" });
    } else {
      const data = await res.json();
      if (data.cashiers) {
        setBlockModal({ branch, cashiers: data.cashiers });
      } else {
        notification.error({ message: data.error ?? "Error al actualizar" });
      }
    }
  };

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
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title={record.is_active ? "Desactivar" : "Reactivar"}>
            <Button
              icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
              size="small"
              danger={record.is_active}
              onClick={() => handleToggleActive(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="!mb-0">Sucursales</Title>
        <Space>
          <Space>
            <EyeOutlined style={{ color: "#6b7280" }} />
            <Text type="secondary">Ver inactivas</Text>
            <Switch size="small" checked={showInactive} onChange={setShowInactive} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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

      {/* Create/Edit modal */}
      <Modal
        title={editing ? "Editar sucursal" : "Nueva sucursal"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
          <Form.Item label="Nombre" name="name" rules={[{ required: true, message: "Ingresá el nombre" }]}>
            <Input placeholder="Ej: Sucursal Centro" />
          </Form.Item>
          <Form.Item label="Dirección" name="address">
            <Input placeholder="Ej: Av. Corrientes 1234" />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editing ? "Guardar cambios" : "Crear sucursal"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Blocked by cashiers modal */}
      <Modal
        title="No se puede desactivar la sucursal"
        open={!!blockModal}
        onCancel={() => setBlockModal(null)}
        footer={<Button onClick={() => setBlockModal(null)}>Entendido</Button>}
      >
        <p className="mb-3">
          Hay {blockModal?.cashiers.length} cajero(s) asignado(s) a <strong>{blockModal?.branch.name}</strong>.
          Desactívalos o reasígnalos antes de continuar.
        </p>
        <ul className="list-disc pl-5">
          {blockModal?.cashiers.map((c) => (
            <li key={c.id}>{c.full_name}</li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
