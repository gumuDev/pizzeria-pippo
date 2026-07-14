"use client";

import { useEffect } from "react";
import { Modal, Form, Input, Select } from "antd";
import { AuthorizedChat, ChatFormValues } from "@/features/telegram-bot/types";

interface Props {
  open: boolean;
  editing: AuthorizedChat | null;
  onClose: () => void;
  onSave: (values: ChatFormValues) => Promise<void>;
}

export function ChatModal({ open, editing, onClose, onSave }: Props) {
  const [form] = Form.useForm<ChatFormValues>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        editing
          ? { chat_id: editing.chat_id, type: editing.type, label: editing.label, plan: editing.plan }
          : { type: "group", plan: "basic", chat_id: "", label: "" }
      );
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSave(values);
  };

  return (
    <Modal
      title={editing ? "Editar chat autorizado" : "Agregar chat autorizado"}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText={editing ? "Guardar" : "Autorizar"}
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="chat_id"
          label="Chat ID"
          rules={[{ required: true, message: "Ingresá el Chat ID" }]}
          extra="ID numérico del usuario o grupo (los grupos tienen ID negativo)."
        >
          <Input placeholder="-1001234567890" disabled={!!editing} />
        </Form.Item>

        <Form.Item
          name="type"
          label="Tipo"
          rules={[{ required: true }]}
        >
          <Select disabled={!!editing}>
            <Select.Option value="personal">Personal</Select.Option>
            <Select.Option value="group">Grupo</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="label"
          label="Nombre descriptivo"
          rules={[{ required: true, message: "Ingresá un nombre" }]}
        >
          <Input placeholder="Dueño — Chat Personal" />
        </Form.Item>

        <Form.Item
          name="plan"
          label="Plan"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="basic">Básico (10 msg/día)</Select.Option>
            <Select.Option value="pro">Pro (50 msg/día)</Select.Option>
            <Select.Option value="unlimited">Sin límite</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
