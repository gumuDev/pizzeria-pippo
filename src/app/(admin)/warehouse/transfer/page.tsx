"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Form, Select, InputNumber, Input, Button, Typography, Space, Alert,
} from "antd";
import { SwapOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { supabase } from "@/lib/supabase";

const { Title, Text } = Typography;

interface Ingredient { id: string; name: string; unit: string; }
interface Branch { id: string; name: string; }
interface WarehouseStock { ingredient_id: string; quantity: number; ingredients: Ingredient; }

export default function WarehouseTransferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedIngredient = searchParams.get("ingredientId");

  const [form] = Form.useForm();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([]);
  const [available, setAvailable] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }, []);

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      const [ingRes, branchRes, stockRes] = await Promise.all([
        supabase.from("ingredients").select("id, name, unit").eq("is_active", true).order("name"),
        supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
        fetch("/api/warehouse/stock", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (ingRes.data) setIngredients(ingRes.data);
      if (branchRes.data) setBranches(branchRes.data);

      const stockData = await stockRes.json();
      if (Array.isArray(stockData)) setWarehouseStock(stockData);

      if (preselectedIngredient) {
        form.setFieldValue("ingredient_id", preselectedIngredient);
        const stockRow = stockData.find((s: WarehouseStock) => s.ingredient_id === preselectedIngredient);
        if (stockRow) {
          setAvailable(stockRow.quantity);
          setSelectedUnit(stockRow.ingredients.unit);
        }
      }
    };
    load();
  }, [getToken, preselectedIngredient, form]);

  const handleIngredientChange = (id: string) => {
    const stockRow = warehouseStock.find((s) => s.ingredient_id === id);
    setAvailable(stockRow?.quantity ?? null);
    const ing = ingredients.find((i) => i.id === id);
    setSelectedUnit(ing?.unit ?? "");
    setError(null);
  };

  const handleSubmit = async (values: {
    ingredient_id: string;
    quantity: number;
    branch_id: string;
    notes?: string;
  }) => {
    setLoading(true);
    setError(null);

    const token = await getToken();
    const res = await fetch("/api/warehouse/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(values),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Error al transferir");
      if (json.available != null) setAvailable(json.available);
      return;
    }

    setSuccess(true);
    form.resetFields();
    setAvailable(null);
    setSelectedUnit("");
    setTimeout(() => { setSuccess(false); router.push("/warehouse"); }, 2000);
  };

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <Space style={{ marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => router.push("/warehouse")}>
          Volver
        </Button>
      </Space>

      <Title level={4} style={{ marginBottom: 20 }}>Transferir a sucursal</Title>

      {success && (
        <Alert type="success" message="Transferencia realizada correctamente" style={{ marginBottom: 16 }} showIcon />
      )}
      {error && (
        <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon closable onClose={() => setError(null)} />
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

        {available !== null && (
          <div style={{ marginBottom: 16, padding: "8px 12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14 }}>
            Disponible en bodega:{" "}
            <Text strong style={{ color: available === 0 ? "#ef4444" : "#16a34a" }}>
              {available} {selectedUnit}
            </Text>
          </div>
        )}

        <Form.Item
          label={`Cantidad${selectedUnit ? ` (${selectedUnit})` : ""}`}
          name="quantity"
          rules={[{ required: true, message: "Ingresá la cantidad" }]}
        >
          <InputNumber
            min={0.001}
            max={available ?? undefined}
            style={{ width: "100%" }}
            placeholder="Ej: 2000"
            addonAfter={selectedUnit || undefined}
          />
        </Form.Item>

        <Form.Item
          label="Destino"
          name="branch_id"
          rules={[{ required: true, message: "Seleccioná una sucursal" }]}
        >
          <Select
            placeholder="Seleccionar sucursal"
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
        </Form.Item>

        <Form.Item label="Notas" name="notes">
          <Input.TextArea rows={2} placeholder="Opcional" />
        </Form.Item>

        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => router.push("/warehouse")}>Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SwapOutlined />}>
            Confirmar transferencia
          </Button>
        </div>
      </Form>
    </div>
  );
}
