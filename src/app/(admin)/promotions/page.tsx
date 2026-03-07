"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Space,
  Tag, Typography, Switch, DatePicker, Tooltip,
  InputNumber, Divider, Row, Col, notification,
} from "antd";
import {
  PlusOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, MinusCircleOutlined, EyeOutlined,
} from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const TYPE_OPTIONS = [
  { value: "BUY_X_GET_Y", label: "Compra X llévate Y (ej: 2x1)" },
  { value: "PERCENTAGE", label: "Descuento porcentual" },
  { value: "COMBO", label: "Precio combo" },
];

const TYPE_COLORS: Record<string, string> = {
  BUY_X_GET_Y: "red",
  PERCENTAGE: "blue",
  COMBO: "green",
};

const DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

interface Branch { id: string; name: string; }
interface Variant { id: string; name: string; product_name: string; }
interface Rule {
  variant_id: string | null;
  buy_qty: number | null;
  get_qty: number | null;
  discount_percent: number | null;
  combo_price: number | null;
}
interface Promotion {
  id: string;
  name: string;
  is_active: boolean;
  type: string;
  days_of_week: number[];
  start_date: string;
  end_date: string;
  branch_id: string | null;
  active: boolean;
  promotion_rules: Rule[];
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [promoType, setPromoType] = useState<string>("");
  const [rules, setRules] = useState<Rule[]>([]);
  const [form] = Form.useForm();

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    const promoUrl = showInactive ? "/api/promotions?showInactive=true" : "/api/promotions";
    const [promoRes, { data: b }, { data: v }] = await Promise.all([
      fetch(promoUrl, { headers: { Authorization: `Bearer ${token}` } }),
      supabase.from("branches").select("*").order("name"),
      supabase
        .from("product_variants")
        .select("id, name, products(name)")
        .order("name"),
    ]);
    const promoData = await promoRes.json();
    if (Array.isArray(promoData)) setPromotions(promoData);
    if (b) setBranches(b);
    if (v) setVariants(v.map((row) => ({
      id: row.id,
      name: row.name,
      product_name: (row.products as { name: string } | null)?.name ?? "",
    })));
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setPromoType("");
    setRules([]);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Promotion) => {
    setEditing(record);
    setPromoType(record.type);
    setRules(record.promotion_rules ?? []);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      days_of_week: record.days_of_week,
      dates: [dayjs(record.start_date), dayjs(record.end_date)],
      branch_id: record.branch_id ?? "all",
      active: record.active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const token = await getToken();

    const payload = {
      name: values.name,
      type: values.type,
      days_of_week: values.days_of_week ?? [],
      start_date: values.dates[0].format("YYYY-MM-DD"),
      end_date: values.dates[1].format("YYYY-MM-DD"),
      branch_id: values.branch_id === "all" ? null : values.branch_id,
      active: values.active ?? true,
      rules,
    };

    const url = editing ? `/api/promotions/${editing.id}` : "/api/promotions";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    if (res.ok) { setModalOpen(false); fetchAll(); }
  };

  const handleToggleIsActive = async (promo: Promotion) => {
    const token = await getToken();
    const res = await fetch(`/api/promotions/${promo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !promo.is_active }),
    });
    if (res.ok) {
      fetchAll();
      notification.success({ message: promo.is_active ? "Promoción desactivada" : "Promoción reactivada" });
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    const token = await getToken();
    await fetch(`/api/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active }),
    });
    fetchAll();
  };

  const addRule = () => {
    setRules((prev) => [...prev, { variant_id: null, buy_qty: null, get_qty: null, discount_percent: null, combo_price: null }]);
  };

  const updateRule = (index: number, field: keyof Rule, value: unknown) => {
    setRules((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const variantOptions = variants.map((v) => ({
    value: v.id,
    label: `${v.product_name} — ${v.name}`,
  }));

  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Tipo",
      dataIndex: "type",
      key: "type",
      render: (t: string) => <Tag color={TYPE_COLORS[t]}>{TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t}</Tag>,
    },
    {
      title: "Días",
      dataIndex: "days_of_week",
      key: "days_of_week",
      render: (days: number[]) => (
        <Space size={2}>
          {DAYS.map((d) => (
            <Tag key={d.value} color={days.includes(d.value) ? "blue" : "default"}>
              {d.label}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Vigencia",
      key: "dates",
      render: (_: unknown, r: Promotion) => (
        <Text className="text-xs">{r.start_date} → {r.end_date}</Text>
      ),
    },
    {
      title: "Sucursal",
      key: "branch",
      render: (_: unknown, r: Promotion) =>
        r.branch_id
          ? <Tag>{branches.find((b) => b.id === r.branch_id)?.name ?? r.branch_id}</Tag>
          : <Tag color="purple">Todas</Tag>,
    },
    {
      title: "Activa",
      key: "active",
      render: (_: unknown, r: Promotion) => (
        <Switch
          checked={r.active}
          size="small"
          onChange={(val) => handleToggleActive(r.id, val)}
        />
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 100,
      render: (_: unknown, r: Promotion) => (
        <Space>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          </Tooltip>
          <Tooltip title={r.is_active ? "Desactivar" : "Reactivar"}>
            <Button
              icon={r.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
              size="small"
              danger={r.is_active}
              onClick={() => handleToggleIsActive(r)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="!mb-0">Promociones</Title>
        <Space>
          <Space>
            <EyeOutlined style={{ color: "#6b7280" }} />
            <Text type="secondary">Ver inactivas</Text>
            <Switch size="small" checked={showInactive} onChange={setShowInactive} />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nueva promoción
          </Button>
        </Space>
      </div>

      <Table
        dataSource={promotions}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editing ? "Editar promoción" : "Nueva promoción"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editing ? "Guardar cambios" : "Crear promoción"}
        cancelText="Cancelar"
        width={680}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item label="Nombre" name="name" rules={[{ required: true, message: "Requerido" }]}>
                <Input placeholder="Ej: 2x1 los miércoles" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Activa" name="active" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tipo" name="type" rules={[{ required: true, message: "Requerido" }]}>
                <Select
                  options={TYPE_OPTIONS}
                  placeholder="Seleccionar tipo"
                  onChange={(val) => { setPromoType(val); setRules([]); }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Sucursal" name="branch_id" initialValue="all">
                <Select
                  options={[
                    { value: "all", label: "Todas las sucursales" },
                    ...branches.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Días de la semana" name="days_of_week">
            <Select
              mode="multiple"
              options={DAYS.map((d) => ({ value: d.value, label: d.label }))}
              placeholder="Todos los días si se deja vacío"
            />
          </Form.Item>

          <Form.Item label="Vigencia" name="dates" rules={[{ required: true, message: "Requerido" }]}>
            <DatePicker.RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          {/* Rules section — varies by type */}
          {promoType && (
            <>
              <Divider orientation="left" plain>Reglas</Divider>

              {rules.map((rule, i) => (
                <div key={i} className="bg-gray-50 rounded p-3 mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Text strong className="text-sm">Regla {i + 1}</Text>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<MinusCircleOutlined />}
                      onClick={() => removeRule(i)}
                    />
                  </div>

                  {promoType === "BUY_X_GET_Y" && (
                    <Row gutter={8}>
                      <Col span={10}>
                        <Text type="secondary" className="text-xs block mb-1">Variante</Text>
                        <Select
                          value={rule.variant_id ?? undefined}
                          options={variantOptions}
                          onChange={(v) => updateRule(i, "variant_id", v)}
                          style={{ width: "100%" }}
                          showSearch
                          placeholder="Seleccionar variante"
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </Col>
                      <Col span={7}>
                        <Text type="secondary" className="text-xs block mb-1">Compra X</Text>
                        <InputNumber
                          value={rule.buy_qty ?? undefined}
                          min={1}
                          style={{ width: "100%" }}
                          placeholder="Ej: 2"
                          onChange={(v) => updateRule(i, "buy_qty", v)}
                        />
                      </Col>
                      <Col span={7}>
                        <Text type="secondary" className="text-xs block mb-1">Llévate Y gratis</Text>
                        <InputNumber
                          value={rule.get_qty ?? undefined}
                          min={1}
                          style={{ width: "100%" }}
                          placeholder="Ej: 1"
                          onChange={(v) => updateRule(i, "get_qty", v)}
                        />
                      </Col>
                    </Row>
                  )}

                  {promoType === "PERCENTAGE" && (
                    <Row gutter={8}>
                      <Col span={14}>
                        <Text type="secondary" className="text-xs block mb-1">Variante (vacío = todos los productos)</Text>
                        <Select
                          value={rule.variant_id ?? undefined}
                          options={variantOptions}
                          onChange={(v) => updateRule(i, "variant_id", v)}
                          style={{ width: "100%" }}
                          showSearch
                          allowClear
                          placeholder="Todos los productos"
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </Col>
                      <Col span={10}>
                        <Text type="secondary" className="text-xs block mb-1">Descuento %</Text>
                        <InputNumber
                          value={rule.discount_percent ?? undefined}
                          min={1}
                          max={100}
                          suffix="%"
                          style={{ width: "100%" }}
                          placeholder="Ej: 20"
                          onChange={(v) => updateRule(i, "discount_percent", v)}
                        />
                      </Col>
                    </Row>
                  )}

                  {promoType === "COMBO" && (
                    <Row gutter={8}>
                      <Col span={14}>
                        <Text type="secondary" className="text-xs block mb-1">Variante del combo</Text>
                        <Select
                          value={rule.variant_id ?? undefined}
                          options={variantOptions}
                          onChange={(v) => updateRule(i, "variant_id", v)}
                          style={{ width: "100%" }}
                          showSearch
                          placeholder="Seleccionar variante"
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </Col>
                      {i === 0 && (
                        <Col span={10}>
                          <Text type="secondary" className="text-xs block mb-1">Precio especial del combo (Bs)</Text>
                          <InputNumber
                            value={rule.combo_price ?? undefined}
                            min={0}
                            prefix="Bs"
                            style={{ width: "100%" }}
                            placeholder="Ej: 150"
                            onChange={(v) => updateRule(i, "combo_price", v)}
                          />
                        </Col>
                      )}
                    </Row>
                  )}
                </div>
              ))}

              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={addRule}
                className="mb-2"
              >
                {promoType === "BUY_X_GET_Y" && "Agregar variante con 2x1"}
                {promoType === "PERCENTAGE" && "Agregar descuento"}
                {promoType === "COMBO" && "Agregar producto al combo"}
              </Button>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
