"use client";

import { Modal, Form, Input, Select, Checkbox, Button } from "antd";
import type { FormInstance } from "antd";
import { UNIT_OPTIONS } from "../constants/ingredient.constants";
import type { Ingredient } from "../types/ingredient.types";

interface Props {
  open: boolean;
  editing: Ingredient | null;
  saving: boolean;
  form: FormInstance;
  onClose: () => void;
  onSubmit: (values: { name: string; unit: string; is_shared_use?: boolean }) => void;
}

export function IngredientModal({ open, editing, saving, form, onClose, onSubmit }: Props) {
  return (
    <Modal
      title={editing ? "Editar insumo" : "Nuevo insumo"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="mt-4">
        <Form.Item label="Nombre" name="name" rules={[{ required: true, message: "Ingresá el nombre" }]}>
          <Input placeholder="Ej: Harina, Mozzarella, Pepperoni" />
        </Form.Item>
        <Form.Item label="Unidad de medida" name="unit" rules={[{ required: true, message: "Seleccioná la unidad" }]}>
          <Select placeholder="Seleccionar unidad" options={UNIT_OPTIONS} />
        </Form.Item>
        <Form.Item name="is_shared_use" valuePropName="checked">
          <Checkbox>
            Se descuenta completo por pedido, no por sabor
            <div className="text-xs text-gray-400">Usar para cajas/empaques — no aplica a masa, queso, toppings</div>
          </Checkbox>
        </Form.Item>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {editing ? "Guardar cambios" : "Crear insumo"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
