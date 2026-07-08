"use client";

import { useEffect } from "react";
import { Modal, Form, Input, Select } from "antd";
import type { Branch } from "@/features/branches/types/branch.types";
import type { Device } from "../types/device.types";

interface Props {
  open: boolean;
  editing: Device | null;
  branches: Branch[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: { branch_id: string; name: string }) => Promise<void>;
}

export function DeviceModal({ open, editing, branches, saving, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<{ branch_id: string; name: string }>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        editing ? { branch_id: editing.branch_id, name: editing.name } : { branch_id: undefined, name: "" }
      );
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  return (
    <Modal
      title={editing ? "Editar dispositivo" : "Agregar dispositivo"}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={saving}
      okText={editing ? "Guardar" : "Crear"}
      cancelText="Cancelar"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="Nombre"
          rules={[{ required: true, message: "Ingresá un nombre" }]}
          extra="Ej: Celular caja 1 - Sucursal Centro"
        >
          <Input placeholder="Celular caja 1" />
        </Form.Item>

        <Form.Item
          name="branch_id"
          label="Sucursal"
          rules={[{ required: true, message: "Seleccioná una sucursal" }]}
          extra={editing ? "La sucursal no se puede cambiar después de crear el dispositivo." : undefined}
        >
          <Select disabled={!!editing} placeholder="Seleccionar sucursal">
            {branches.map((branch) => (
              <Select.Option key={branch.id} value={branch.id}>{branch.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
