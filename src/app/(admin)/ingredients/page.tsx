"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Space,
  Tag, Typography, Switch, Tooltip, notification,
} from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, EyeOutlined,
} from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;

const UNIT_OPTIONS = [
  { value: "g", label: "Gramos (g)" },
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "l", label: "Litros (l)" },
  { value: "unidad", label: "Unidades" },
];

const UNIT_COLORS: Record<string, string> = {
  g: "blue", kg: "geekblue", ml: "cyan", l: "teal", unidad: "purple",
};

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  is_active: boolean;
}

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

export default function IngredientsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [form] = Form.useForm();

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("ingredients").select("*").order("name", { ascending: true });
    if (!showInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (!error && data) setIngredients(data);
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchIngredients(); }, [fetchIngredients]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Ingredient) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name, unit: record.unit });
    setModalOpen(true);
  };

  const handleSubmit = async (values: { name: string; unit: string }) => {
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("ingredients").update(values).eq("id", editing.id);
      if (!error) { setModalOpen(false); fetchIngredients(); notification.success({ message: "Insumo actualizado" }); }
      else notification.error({ message: error.message });
    } else {
      const { error } = await supabase.from("ingredients").insert(values);
      if (!error) { setModalOpen(false); fetchIngredients(); notification.success({ message: "Insumo creado" }); }
      else notification.error({ message: error.message });
    }
    setSaving(false);
  };

  const handleToggleActive = async (record: Ingredient) => {
    const token = await getToken();
    const res = await fetch(`/api/ingredients/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !record.is_active }),
    });

    if (res.ok) {
      fetchIngredients();
      notification.success({ message: record.is_active ? "Insumo desactivado" : "Insumo reactivado" });
    } else {
      const { error } = await res.json();
      notification.error({ message: error ?? "Error al actualizar" });
    }
  };

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
        <Title level={4} className="!mb-0">Insumos</Title>
        <Space>
          <Space>
            <EyeOutlined style={{ color: "#6b7280" }} />
            <Text type="secondary">Ver inactivos</Text>
            <Switch size="small" checked={showInactive} onChange={setShowInactive} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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

      <Modal
        title={editing ? "Editar insumo" : "Nuevo insumo"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
          <Form.Item label="Nombre" name="name" rules={[{ required: true, message: "Ingresá el nombre" }]}>
            <Input placeholder="Ej: Harina, Mozzarella, Pepperoni" />
          </Form.Item>
          <Form.Item label="Unidad de medida" name="unit" rules={[{ required: true, message: "Seleccioná la unidad" }]}>
            <Select placeholder="Seleccionar unidad" options={UNIT_OPTIONS} />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editing ? "Guardar cambios" : "Crear insumo"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
