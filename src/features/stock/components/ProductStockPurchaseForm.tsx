"use client";

import { Form, Select, InputNumber, Button } from "antd";
import type { FormInstance } from "antd";
import type { ProductVariantOption } from "../types/stock.types";

const IconPlus = () => (
  <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

interface Props {
  form: FormInstance;
  variants: ProductVariantOption[];
  isNewVariant: boolean;
  onVariantChange: (variantId: string) => void;
  onSubmit: (values: { variant_id: string; quantity: number; min_quantity?: number }) => void;
}

export function ProductStockPurchaseForm({ form, variants, isNewVariant, onVariantChange, onSubmit }: Props) {
  return (
    <div className="max-w-md">
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item label="Producto" name="variant_id" rules={[{ required: true, message: "Requerido" }]}>
          <Select
            showSearch
            placeholder="Seleccionar producto"
            options={variants.map((v) => ({
              value: v.variantId,
              label: v.variantName === "Unidad" ? v.productName : `${v.productName} — ${v.variantName}`,
            }))}
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            onChange={onVariantChange}
          />
        </Form.Item>
        <Form.Item label="Cantidad" name="quantity" rules={[{ required: true, message: "Requerido" }]}>
          <InputNumber min={1} style={{ width: "100%" }} placeholder="Ej: 12" />
        </Form.Item>
        {isNewVariant && (
          <Form.Item
            label="Stock mínimo"
            name="min_quantity"
            tooltip="Primer ingreso de este producto en esta sucursal. Definí a partir de qué cantidad querés recibir alerta de stock bajo."
            rules={[{ required: true, message: "Requerido para productos nuevos" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} placeholder="Ej: 5" />
          </Form.Item>
        )}
        <Button type="primary" htmlType="submit" icon={<IconPlus />}>
          Registrar entrada
        </Button>
      </Form>
    </div>
  );
}
