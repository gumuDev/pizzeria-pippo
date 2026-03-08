"use client";

import { Form, Select, InputNumber, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import type { Ingredient } from "../types/stock.types";

interface Props {
  form: FormInstance;
  ingredients: Ingredient[];
  isNewIngredient: boolean;
  onIngredientChange: (id: string) => void;
  onSubmit: (values: { ingredient_id: string; quantity: number; min_quantity?: number }) => void;
}

export function StockPurchaseForm({ form, ingredients, isNewIngredient, onIngredientChange, onSubmit }: Props) {
  return (
    <div className="max-w-md">
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item label="Insumo" name="ingredient_id" rules={[{ required: true, message: "Requerido" }]}>
          <Select
            showSearch
            placeholder="Seleccionar insumo"
            options={ingredients.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            onChange={onIngredientChange}
          />
        </Form.Item>
        <Form.Item label="Cantidad" name="quantity" rules={[{ required: true, message: "Requerido" }]}>
          <InputNumber min={0.001} style={{ width: "100%" }} placeholder="Ej: 500" />
        </Form.Item>
        {isNewIngredient && (
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
  );
}
