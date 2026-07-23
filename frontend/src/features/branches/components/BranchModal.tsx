"use client";

import { Modal, Form, Input, Button, TimePicker } from "antd";
import type { FormInstance } from "antd";
import type { Dayjs } from "dayjs";
import type { Branch } from "../types/branch.types";

interface Props {
  open: boolean;
  editing: Branch | null;
  saving: boolean;
  form: FormInstance;
  onClose: () => void;
  onSubmit: (values: { name: string; address?: string; phone?: string; expected_start_time?: Dayjs }) => void;
}

export function BranchModal({ open, editing, saving, form, onClose, onSubmit }: Props) {
  return (
    <Modal
      title={editing ? "Editar sucursal" : "Nueva sucursal"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="mt-4">
        <Form.Item label="Nombre" name="name" rules={[{ required: true, message: "Ingresá el nombre" }]}>
          <Input placeholder="Ej: Sucursal Centro" />
        </Form.Item>
        <Form.Item label="Dirección" name="address">
          <Input placeholder="Ej: Av. Corrientes 1234" />
        </Form.Item>
        <Form.Item label="Teléfono" name="phone">
          <Input placeholder="Ej: 67106933" />
        </Form.Item>
        <Form.Item
          label="Horario de entrada"
          name="expected_start_time"
          extra="Solo informativo — se muestra junto al historial de asistencia, no marca tardanzas."
        >
          <TimePicker format="HH:mm" style={{ width: "100%" }} placeholder="Ej: 08:00" />
        </Form.Item>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {editing ? "Guardar cambios" : "Crear sucursal"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
