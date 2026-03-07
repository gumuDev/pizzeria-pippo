"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Form, Select, InputNumber, Input, Button, Typography, Space, Alert,
} from "antd";
import { ShoppingCartOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;

interface Ingredient { id: string; name: string; unit: string; }
interface WarehouseStock { ingredient_id: string; quantity: number; min_quantity: number; }

export default function WarehousePurchasePage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const [ingRes, stockRes] = await Promise.all([
        supabase.from("ingredients").select("id, name, unit").eq("is_active", true).order("name"),
        fetch("/api/warehouse/stock", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (ingRes.data) setIngredients(ingRes.data);
      const stockData = await stockRes.json();
      if (Array.isArray(stockData)) setWarehouseStock(stockData);
    };
    load();
  }, []);

  const handleIngredientChange = (id: string) => {
    const ing = ingredients.find((i) => i.id === id);
    setSelectedUnit(ing?.unit ?? "");

    const stock = warehouseStock.find((s) => s.ingredient_id === id);
    setCurrentStock(stock?.quantity ?? 0);
    form.setFieldValue("min_quantity", stock?.min_quantity ?? 0);
  };

  const handleSubmit = async (values: {
    ingredient_id: string;
    quantity: number;
    min_quantity: number;
    notes?: string;
  }) => {
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? "";

    const res = await fetch("/api/warehouse/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(values),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Error al registrar compra");
      return;
    }

    setSuccess(true);
    form.resetFields();
    setSelectedUnit("");
    setCurrentStock(null);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="p-6 max-w-lg">
      <Space className="mb-6">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => router.push("/warehouse")}>
          Volver
        </Button>
      </Space>

      <Title level={4} className="!mb-6">Registrar compra en bodega</Title>

      {success && (
        <Alert type="success" message="Compra registrada correctamente" className="mb-4" showIcon />
      )}
      {error && (
        <Alert type="error" message={error} className="mb-4" showIcon closable onClose={() => setError(null)} />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Insumo"
          name="ingredient_id"
          rules={[{ required: true, message: "Seleccioná un insumo" }]}
        >
          <Select
            showSearch
            placeholder="Seleccionar insumo"
            options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            onChange={handleIngredientChange}
          />
        </Form.Item>

        {currentStock !== null && (
          <div className="mb-4 px-3 py-2 bg-gray-50 rounded border text-sm">
            Stock actual en bodega:{" "}
            <Text strong className="text-green-600">{currentStock} {selectedUnit}</Text>
          </div>
        )}

        <Form.Item
          label={`Cantidad a ingresar${selectedUnit ? ` (${selectedUnit})` : ""}`}
          name="quantity"
          rules={[{ required: true, message: "Ingresá la cantidad" }]}
        >
          <InputNumber
            min={0.001}
            style={{ width: "100%" }}
            placeholder="Ej: 5000"
            addonAfter={selectedUnit || undefined}
          />
        </Form.Item>

        <Form.Item
          label={`Stock mínimo${selectedUnit ? ` (${selectedUnit})` : ""}`}
          name="min_quantity"
          tooltip="Cantidad mínima en bodega antes de recibir alerta de stock bajo"
          rules={[{ required: true, message: "Ingresá el mínimo" }]}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            placeholder="Ej: 1000"
            addonAfter={selectedUnit || undefined}
          />
        </Form.Item>

        <Form.Item label="Notas" name="notes">
          <Input.TextArea rows={2} placeholder="Ej: Proveedor X, factura #123" />
        </Form.Item>

        <div className="flex gap-2">
          <Button onClick={() => router.push("/warehouse")}>Cancelar</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<ShoppingCartOutlined />}
          >
            Registrar entrada
          </Button>
        </div>
      </Form>
    </div>
  );
}
