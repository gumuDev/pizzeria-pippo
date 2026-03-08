"use client";

import { Modal, Form, InputNumber, Button } from "antd";
import type { FormInstance } from "antd";
import type { StockRow } from "../types/stock.types";

interface Props {
  open: boolean;
  editingStock: StockRow | null;
  form: FormInstance;
  onClose: () => void;
  onSubmit: (values: { min_quantity: number }) => void;
}

export function StockMinQtyModal({ open, editingStock, form, onClose, onSubmit }: Props) {
  return (
    <Modal
      title={`Stock mínimo — ${editingStock?.ingredients?.name}`}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} className="mt-4">
        <Form.Item label="Cantidad mínima" name="min_quantity" rules={[{ required: true, message: "Requerido" }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" htmlType="submit">Guardar</Button>
        </div>
      </Form>
    </Modal>
  );
}
