"use client";

import { Modal, Form, Input, Checkbox } from "antd";
import { useEffect } from "react";
import type { ProductCategory, ProductCategoryInput } from "../types/product-category.types";

interface Props {
  open: boolean;
  editing: ProductCategory | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: ProductCategoryInput) => void;
}

export function CategoryModal({ open, editing, saving, onClose, onSave }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(editing ?? { name: "", allow_mixing: false });
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSave(values);
  };

  return (
    <Modal
      open={open}
      title={editing ? "Editar categoría" : "Nueva categoría"}
      onCancel={onClose}
      onOk={handleOk}
      okText={editing ? "Guardar" : "Crear"}
      confirmLoading={saving}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="name" label="Nombre" rules={[{ required: true, message: "Requerido" }]}>
          <Input placeholder="Ej: Empanadas" />
        </Form.Item>
        <Form.Item name="allow_mixing" valuePropName="checked">
          <Checkbox>Permite productos mixtos (mitad/mitad)</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
}
