"use client";

import { useRouter } from "next/navigation";
import { Form, Select, InputNumber, Input, Button, Typography, Space, Alert, Radio } from "antd";
import { useWarehousePurchase } from "@/features/warehouse/hooks/useWarehousePurchase";

const { Title, Text } = Typography;

const IconCart = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

export default function WarehousePurchasePage() {
  const router = useRouter();
  const {
    form, purchaseType, ingredients, variants,
    selectedUnit, currentStock, loading, error, success,
    setError, handleTypeChange, handleIngredientChange, handleVariantChange, handleSubmit,
  } = useWarehousePurchase();

  const isIngredient = purchaseType === "ingredient";

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <Space style={{ marginBottom: 20 }}>
        <Button icon={<IconArrowLeft />} type="text" onClick={() => router.push("/warehouse")}>Volver</Button>
      </Space>

      <Title level={4} style={{ marginBottom: 20 }}>Registrar compra en bodega</Title>

      <Radio.Group value={purchaseType} onChange={(e) => handleTypeChange(e.target.value)}
        optionType="button" buttonStyle="solid" style={{ marginBottom: 24 }}>
        <Radio.Button value="ingredient">🧂 Insumos</Radio.Button>
        <Radio.Button value="product">📦 Reventa</Radio.Button>
      </Radio.Group>

      {success && <Alert type="success" message="Compra registrada correctamente" style={{ marginBottom: 16 }} showIcon />}
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon closable onClose={() => setError(null)} />}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {isIngredient ? (
          <Form.Item label="Insumo" name="ingredient_id" rules={[{ required: true, message: "Seleccioná un insumo" }]}>
            <Select showSearch placeholder="Seleccionar insumo" onChange={handleIngredientChange}
              options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
              filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        ) : (
          <Form.Item label="Producto" name="variant_id" rules={[{ required: true, message: "Seleccioná un producto" }]}>
            <Select showSearch placeholder="Seleccionar producto" onChange={handleVariantChange}
              options={variants.map((v) => ({
                value: v.id,
                label: v.name === "Unidad" ? (v.products?.name ?? v.id) : `${v.products?.name ?? ""} — ${v.name}`,
              }))}
              filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        )}

        {currentStock !== null && (
          <div style={{ marginBottom: 16, padding: "8px 12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14 }}>
            Stock actual en bodega: <Text strong style={{ color: "#16a34a" }}>{currentStock} {selectedUnit}</Text>
          </div>
        )}

        <Form.Item label={`Cantidad a ingresar${selectedUnit ? ` (${selectedUnit})` : ""}`} name="quantity"
          rules={[
            { required: true, message: "Ingresá la cantidad" },
            { type: "number", min: 0.001, message: "La cantidad debe ser mayor a 0" },
          ]}>
          <InputNumber style={{ width: "100%" }} placeholder={isIngredient ? "Ej: 5000" : "Ej: 24"} addonAfter={selectedUnit || undefined} />
        </Form.Item>

        <Form.Item label={`Stock mínimo${selectedUnit ? ` (${selectedUnit})` : ""}`} name="min_quantity"
          tooltip="Cantidad mínima en bodega antes de recibir alerta de stock bajo"
          rules={[{ required: true, message: "Ingresá el mínimo" }]}>
          <InputNumber min={0} style={{ width: "100%" }} placeholder="Ej: 5" addonAfter={selectedUnit || undefined} />
        </Form.Item>

        <Form.Item label="Notas" name="notes">
          <Input.TextArea rows={2} placeholder="Ej: Proveedor X, factura #123" />
        </Form.Item>

        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => router.push("/warehouse")}>Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<IconCart />}>Registrar entrada</Button>
        </div>
      </Form>
    </div>
  );
}
