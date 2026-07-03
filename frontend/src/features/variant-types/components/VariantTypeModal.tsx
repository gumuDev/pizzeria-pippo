"use client";

import { useEffect } from "react";
import { Modal, Form, Input, InputNumber } from "antd";
import type { VariantType } from "../types/variant-type.types";

interface Props {
  open: boolean;
  editing: VariantType | null;
  saving: boolean;
  onSave: (name: string, sort_order: number) => void;
  onClose: () => void;
}

export function VariantTypeModal({ open, editing, saving, onSave, onClose }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(editing
        ? { name: editing.name, sort_order: editing.sort_order }
        : { name: "", sort_order: 0 }
      );
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSave(values.name.trim(), values.sort_order ?? 0);
  };

  return (
    <Modal
      title={editing ? "Editar tipo de variante" : "Nuevo tipo de variante"}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText={editing ? "Guardar cambios" : "Crear"}
      cancelText="Cancelar"
      confirmLoading={saving}
      afterClose={() => form.resetFields()}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="name"
          label="Nombre"
          rules={[{ required: true, message: "El nombre es requerido" }]}
        >
          <Input placeholder="Ej: Personal, XL, Litro..." maxLength={50} />
        </Form.Item>
        <Form.Item
          name="sort_order"
          label="Orden"
          tooltip="Define el orden en que aparece en el selector de variantes"
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
