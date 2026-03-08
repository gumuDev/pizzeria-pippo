"use client";

import { Form, Select, InputNumber, Input, Button, Typography } from "antd";
import { ToolOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import type { Ingredient } from "../types/stock.types";

const { Text } = Typography;

interface Props {
  form: FormInstance;
  ingredients: Ingredient[];
  onSubmit: (values: { ingredient_id: string; real_quantity: number; notes?: string }) => void;
}

export function StockAdjustForm({ form, ingredients, onSubmit }: Props) {
  return (
    <div className="max-w-md">
      <Text type="secondary" className="block mb-4">
        Ingresá la cantidad real contada físicamente. El sistema calculará la diferencia.
      </Text>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item label="Insumo" name="ingredient_id" rules={[{ required: true, message: "Requerido" }]}>
          <Select
            showSearch
            placeholder="Seleccionar insumo"
            options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
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
  );
}
