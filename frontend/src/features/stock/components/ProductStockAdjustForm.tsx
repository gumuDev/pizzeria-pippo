"use client";

import { Form, Select, InputNumber, Input, Button } from "antd";
import type { FormInstance } from "antd";
import type { ProductVariantOption } from "../types/stock.types";

interface Props {
  form: FormInstance;
  variants: ProductVariantOption[];
  onSubmit: (values: { variant_id: string; real_quantity: number; notes?: string }) => void;
}

export function ProductStockAdjustForm({ form, variants, onSubmit }: Props) {
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
          />
        </Form.Item>
        <Form.Item label="Cantidad real (conteo físico)" name="real_quantity" rules={[{ required: true, message: "Requerido" }]}>
          <InputNumber min={0} style={{ width: "100%" }} placeholder="Ej: 8" />
        </Form.Item>
        <Form.Item label="Notas" name="notes">
          <Input.TextArea rows={2} placeholder="Motivo del ajuste (opcional)" />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Aplicar ajuste
        </Button>
      </Form>
    </div>
  );
}
