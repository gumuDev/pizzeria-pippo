"use client";

import { useEffect } from "react";
import { Modal, Form, Input } from "antd";
import type { VariantType } from "../types/variant-type.types";

interface Props {
  open: boolean;
  editing: VariantType | null;
  saving: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function VariantTypeModal({ open, editing, saving, onSave, onClose }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(editing ? { name: editing.name } : { name: "" });
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSave(values.name.trim());
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
      </Form>
    </Modal>
  );
}
