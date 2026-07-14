"use client";

import { Modal, Form, Input, Select, Button } from "antd";
import type { FormInstance } from "antd";
import { ROLE_OPTIONS } from "../constants/user.constants";
import type { User, Branch, UserRole } from "../types/user.types";

interface Props {
  open: boolean;
  editing: User | null;
  saving: boolean;
  selectedRole: UserRole;
  branches: Branch[];
  form: FormInstance;
  onClose: () => void;
  onSubmit: (values: {
    full_name: string;
    email?: string;
    password?: string;
    role: UserRole;
    branch_id?: string | null;
  }) => void;
  onRoleChange: (role: UserRole) => void;
}

export function UserModal({ open, editing, saving, selectedRole, branches, form, onClose, onSubmit, onRoleChange }: Props) {
  return (
    <Modal
      title={editing ? "Editar usuario" : "Nuevo usuario"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="mt-4">
        <Form.Item
          label="Nombre completo"
          name="full_name"
          rules={[{ required: true, message: "Ingresá el nombre del usuario" }]}
        >
          <Input placeholder="Ej: Juan Pérez" />
        </Form.Item>

        {!editing && (
          <>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Ingresá el email" },
                { type: "email", message: "Email inválido" },
              ]}
            >
              <Input placeholder="usuario@ejemplo.com" />
            </Form.Item>
            <Form.Item
              label="Contraseña"
              name="password"
              rules={[
                { required: true, message: "Ingresá la contraseña" },
                { min: 6, message: "Mínimo 6 caracteres" },
              ]}
            >
              <Input.Password placeholder="Mínimo 6 caracteres" />
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Rol"
          name="role"
          rules={[{ required: true, message: "Seleccioná un rol" }]}
        >
          <Select options={ROLE_OPTIONS} onChange={onRoleChange} />
        </Form.Item>

        <Form.Item
          label="Sucursal"
          name="branch_id"
          rules={[{
            required: selectedRole === "cajero" || selectedRole === "cocinero",
            message: "Seleccioná la sucursal",
          }]}
        >
          <Select
            disabled={selectedRole === "admin"}
            placeholder="Seleccioná una sucursal"
            allowClear
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
          />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {editing ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
