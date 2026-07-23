"use client";

import { useEffect } from "react";
import { Modal, Form, Input, Select, AutoComplete } from "antd";
import type { Branch } from "@/features/branches/types/branch.types";
import type { Employee } from "../types/employee.types";
import { POSITION_OPTIONS } from "../constants/position-options";

interface Props {
  open: boolean;
  editing: Employee | null;
  branches: Branch[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: { branch_id: string; full_name: string; position: string }) => Promise<void>;
}

export function EmployeeModal({ open, editing, branches, saving, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<{ branch_id: string; full_name: string; position: string }>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        editing
          ? { branch_id: editing.branch_id, full_name: editing.full_name, position: editing.position }
          : { branch_id: undefined, full_name: "", position: "" }
      );
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  return (
    <Modal
      title={editing ? "Editar empleado" : "Agregar empleado"}
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
          name="full_name"
          label="Nombre completo"
          rules={[{ required: true, message: "Ingresá el nombre" }]}
        >
          <Input placeholder="Juan Pérez" />
        </Form.Item>

        <Form.Item
          name="position"
          label="Puesto"
          rules={[{ required: true, message: "Ingresá el puesto" }]}
        >
          <AutoComplete
            options={POSITION_OPTIONS.map((p) => ({ value: p }))}
            filterOption={(input, option) => (option?.value ?? "").toLowerCase().includes(input.toLowerCase())}
            placeholder="Ej: Delivery"
          />
        </Form.Item>

        <Form.Item
          name="branch_id"
          label="Sucursal"
          rules={[{ required: true, message: "Seleccioná una sucursal" }]}
        >
          <Select placeholder="Seleccionar sucursal">
            {branches.map((branch) => (
              <Select.Option key={branch.id} value={branch.id}>{branch.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
