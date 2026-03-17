"use client";

import { Modal, Form, InputNumber, Input, Button } from "antd";
import type { FormInstance } from "antd";
import type { WarehouseRow } from "../types/warehouse.types";

interface AdjustModalProps {
  adjustingRow: WarehouseRow | null;
  form: FormInstance;
  loading: boolean;
  onSubmit: (values: { real_quantity: number; notes: string }) => void;
  onClose: () => void;
}

export function WarehouseAdjustModal({ adjustingRow, form, loading, onSubmit, onClose }: AdjustModalProps) {
  return (
    <Modal
      title={`Ajustar stock — ${adjustingRow?.ingredient_name}`}
      open={!!adjustingRow}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 16 }}>
        <Form.Item
          label={`Cantidad real (${adjustingRow?.unit})`}
          name="real_quantity"
          rules={[{ required: true, message: "Requerido" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          label="Motivo del ajuste"
          name="notes"
          rules={[{ required: true, message: "El motivo es requerido" }]}
        >
          <Input placeholder="Ej: Conteo físico, merma, error de carga..." />
        </Form.Item>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={loading}>Guardar</Button>
        </div>
      </Form>
    </Modal>
  );
}

interface MinQtyModalProps {
  editingRow: WarehouseRow | null;
  form: FormInstance;
  onSubmit: (values: { min_quantity: number }) => void;
  onClose: () => void;
}

export function WarehouseMinQtyModal({ editingRow, form, onSubmit, onClose }: MinQtyModalProps) {
  return (
    <Modal
      title={`Stock mínimo — ${editingRow?.ingredient_name}`}
      open={!!editingRow}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 16 }}>
        <Form.Item
          label={`Cantidad mínima (${editingRow?.unit})`}
          name="min_quantity"
          rules={[{ required: true, message: "Requerido" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" htmlType="submit">Guardar</Button>
        </div>
      </Form>
    </Modal>
  );
}
