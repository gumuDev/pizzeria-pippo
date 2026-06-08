"use client";

import { Form, Select, InputNumber, Button } from "antd";
import type { FormInstance } from "antd";
import type { ProductVariantOption } from "../types/stock.types";

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
        <Button type="primary" htmlType="submit">
          Registrar entrada
        </Button>
      </Form>
    </div>
  );
}
