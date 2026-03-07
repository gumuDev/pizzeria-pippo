"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table, Button, Modal, Form, Select, InputNumber,
  Input, Tag, Typography, Space, Tabs, Badge, Tooltip,
} from "antd";
import {
  PlusOutlined, WarningOutlined, HistoryOutlined,
  ShoppingCartOutlined, ToolOutlined,
} from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;

interface Branch { id: string; name: string; }
interface Ingredient { id: string; name: string; unit: string; }
interface StockRow {
  id: string;
  branch_id: string;
  ingredient_id: string;
  quantity: number;
  min_quantity: number;
  ingredients: Ingredient;
  branches: Branch;
}
interface Movement {
  id: string;
  branch_id: string;
  ingredient_id: string;
  quantity: number;
  type: string;
  notes: string | null;
  created_at: string;
  ingredients?: Ingredient;
  branches?: Branch;
}

const TYPE_COLORS: Record<string, string> = {
  compra: "green",
  venta: "blue",
  ajuste: "orange",
};

const TYPE_LABELS: Record<string, string> = {
  compra: "Compra",
  venta: "Venta",
  ajuste: "Ajuste",
};

export default function StockPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [alerts, setAlerts] = useState<StockRow[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [minQtyOpen, setMinQtyOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockRow | null>(null);
  const [purchaseIngredientIsNew, setPurchaseIngredientIsNew] = useState(false);

  const [purchaseForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const [minQtyForm] = Form.useForm();

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: b }, { data: i }] = await Promise.all([
      supabase.from("branches").select("*").order("name"),
      supabase.from("ingredients").select("*").order("name"),
    ]);
    if (b) { setBranches(b); if (!selectedBranch && b.length) setSelectedBranch(b[0].id); }
    if (i) setIngredients(i);
    setLoading(false);
  }, [selectedBranch]);

  const fetchStock = useCallback(async (branchId: string) => {
    if (!branchId) return;
    setLoading(true);
    const token = await getToken();
    const [stockRes, alertsRes, movRes] = await Promise.all([
      fetch(`/api/stock?branchId=${branchId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/stock/alerts?branchId=${branchId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/stock/movements?branchId=${branchId}`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const [stockData, alertsData, movData] = await Promise.all([
      stockRes.json(), alertsRes.json(), movRes.json(),
    ]);
    if (Array.isArray(stockData)) setStock(stockData);
    if (Array.isArray(alertsData)) setAlerts(alertsData);
    if (Array.isArray(movData)) setMovements(movData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (selectedBranch) fetchStock(selectedBranch); }, [selectedBranch, fetchStock]);

  const handlePurchaseIngredientChange = (ingredientId: string) => {
    const alreadyInStock = stock.some((s) => s.ingredient_id === ingredientId);
    setPurchaseIngredientIsNew(!alreadyInStock);
    if (alreadyInStock) purchaseForm.setFieldValue("min_quantity", undefined);
  };

  const handlePurchase = async (values: { ingredient_id: string; quantity: number; min_quantity?: number }) => {
    const token = await getToken();
    const res = await fetch("/api/stock/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ branch_id: selectedBranch, ...values }),
    });
    if (res.ok) { setPurchaseOpen(false); purchaseForm.resetFields(); fetchStock(selectedBranch); }
  };

  const handleAdjust = async (values: { ingredient_id: string; real_quantity: number; notes?: string }) => {
    const token = await getToken();
    const res = await fetch("/api/stock/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ branch_id: selectedBranch, ...values }),
    });
    if (res.ok) { setAdjustOpen(false); adjustForm.resetFields(); fetchStock(selectedBranch); }
  };

  const openMinQty = (record: StockRow) => {
    setEditingStock(record);
    minQtyForm.setFieldsValue({ min_quantity: record.min_quantity });
    setMinQtyOpen(true);
  };

  const handleMinQty = async (values: { min_quantity: number }) => {
    if (!editingStock) return;
    await supabase
      .from("branch_stock")
      .update({ min_quantity: values.min_quantity })
      .eq("id", editingStock.id);
    setMinQtyOpen(false);
    fetchStock(selectedBranch);
  };

  const stockColumns = [
    {
      title: "Insumo",
      key: "ingredient",
      render: (_: unknown, r: StockRow) => (
        <Space>
          {r.quantity < r.min_quantity && (
            <Tooltip title="Stock bajo el mínimo">
              <WarningOutlined className="text-red-500" />
            </Tooltip>
          )}
          <Text>{r.ingredients?.name}</Text>
        </Space>
      ),
    },
    {
      title: "Unidad",
      key: "unit",
      render: (_: unknown, r: StockRow) => <Tag>{r.ingredients?.unit}</Tag>,
    },
    {
      title: "Stock actual",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty: number, r: StockRow) => (
        <Text strong className={qty < r.min_quantity ? "text-red-500" : "text-green-600"}>
          {qty}
        </Text>
      ),
    },
    {
      title: "Mínimo",
      dataIndex: "min_quantity",
      key: "min_quantity",
      render: (min: number, r: StockRow) => (
        <Button type="link" size="small" className="!p-0" onClick={() => openMinQty(r)}>
          {min}
        </Button>
      ),
    },
    {
      title: "Estado",
      key: "status",
      render: (_: unknown, r: StockRow) =>
        r.quantity < r.min_quantity
          ? <Tag color="red">Stock bajo</Tag>
          : <Tag color="green">OK</Tag>,
    },
  ];

  const movementColumns = [
    {
      title: "Fecha",
      dataIndex: "created_at",
      key: "created_at",
      render: (d: string) => new Date(d).toLocaleString("es-BO"),
    },
    {
      title: "Insumo",
      key: "ingredient",
      render: (_: unknown, r: Movement) => r.ingredients?.name ?? r.ingredient_id,
    },
    {
      title: "Tipo",
      dataIndex: "type",
      key: "type",
      render: (t: string) => <Tag color={TYPE_COLORS[t]}>{TYPE_LABELS[t] ?? t}</Tag>,
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
      render: (q: number) => (
        <Text className={q >= 0 ? "text-green-600" : "text-red-500"}>
          {q >= 0 ? `+${q}` : q}
        </Text>
      ),
    },
    {
      title: "Notas",
      dataIndex: "notes",
      key: "notes",
      render: (n: string | null) => n ?? "—",
    },
  ];

  const tabItems = [
    {
      key: "stock",
      label: (
        <Space>
          Stock actual
          {alerts.length > 0 && <Badge count={alerts.length} />}
        </Space>
      ),
      children: (
        <Table
          dataSource={stock}
          columns={stockColumns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          rowClassName={(r: StockRow) => r.quantity < r.min_quantity ? "bg-red-50" : ""}
        />
      ),
    },
    {
      key: "purchase",
      label: <Space><ShoppingCartOutlined />Registrar compra</Space>,
      children: (
        <div className="max-w-md">
          <Form form={purchaseForm} layout="vertical" onFinish={handlePurchase}>
            <Form.Item label="Insumo" name="ingredient_id" rules={[{ required: true, message: "Requerido" }]}>
              <Select
                showSearch
                placeholder="Seleccionar insumo"
                options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                onChange={handlePurchaseIngredientChange}
              />
            </Form.Item>
            <Form.Item label="Cantidad" name="quantity" rules={[{ required: true, message: "Requerido" }]}>
              <InputNumber min={0.001} style={{ width: "100%" }} placeholder="Ej: 500" />
            </Form.Item>
            {purchaseIngredientIsNew && (
              <Form.Item
                label="Stock mínimo"
                name="min_quantity"
                tooltip="Primer ingreso de este insumo en esta sucursal. Definí a partir de qué cantidad querés recibir alerta de stock bajo."
                rules={[{ required: true, message: "Requerido para insumos nuevos" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} placeholder="Ej: 500" />
              </Form.Item>
            )}
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Registrar entrada
            </Button>
          </Form>
        </div>
      ),
    },
    {
      key: "adjust",
      label: <Space><ToolOutlined />Ajuste manual</Space>,
      children: (
        <div className="max-w-md">
          <Text type="secondary" className="block mb-4">
            Ingresá la cantidad real contada físicamente. El sistema calculará la diferencia.
          </Text>
          <Form form={adjustForm} layout="vertical" onFinish={handleAdjust}>
            <Form.Item label="Insumo" name="ingredient_id" rules={[{ required: true, message: "Requerido" }]}>
              <Select
                showSearch
                placeholder="Seleccionar insumo"
                options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item label="Cantidad real (conteo físico)" name="real_quantity" rules={[{ required: true, message: "Requerido" }]}>
              <InputNumber min={0} style={{ width: "100%" }} placeholder="Ej: 1200" />
            </Form.Item>
            <Form.Item label="Motivo del ajuste" name="notes">
              <Input.TextArea rows={2} placeholder="Ej: Merma, error de conteo anterior..." />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<ToolOutlined />}>
              Aplicar ajuste
            </Button>
          </Form>
        </div>
      ),
    },
    {
      key: "history",
      label: <Space><HistoryOutlined />Historial</Space>,
      children: (
        <Table
          dataSource={movements}
          columns={movementColumns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Title level={4} className="!mb-0">Stock</Title>
          {alerts.length > 0 && (
            <Tag color="red" icon={<WarningOutlined />}>
              {alerts.length} insumo{alerts.length > 1 ? "s" : ""} bajo mínimo
            </Tag>
          )}
        </div>
        <Select
          value={selectedBranch}
          onChange={setSelectedBranch}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
          style={{ width: 200 }}
          placeholder="Seleccionar sucursal"
        />
      </div>

      <Tabs items={tabItems} />

      {/* Modal: editar stock mínimo */}
      <Modal
        title={`Stock mínimo — ${editingStock?.ingredients?.name}`}
        open={minQtyOpen}
        onCancel={() => setMinQtyOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={minQtyForm} layout="vertical" onFinish={handleMinQty} className="mt-4">
          <Form.Item label="Cantidad mínima" name="min_quantity" rules={[{ required: true, message: "Requerido" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setMinQtyOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">Guardar</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
