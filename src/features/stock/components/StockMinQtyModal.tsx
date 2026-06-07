"use client";

import { Modal, Form, InputNumber, Button, Typography } from "antd";
import type { FormInstance } from "antd";
import type { StockRow, ProductStockRow } from "../types/stock.types";

const { Text } = Typography;

interface Props {
  open: boolean;
  editingStock: StockRow | null;
  productStock?: ProductStockRow | null;
  form: FormInstance;
  onClose: () => void;
  onSubmit: (values: { min_quantity: number }) => void;
}

export function StockMinQtyModal({ open, editingStock, productStock, form, onClose, onSubmit }: Props) {
  const isProduct = !!productStock;
  const productName = productStock?.product_variants?.products?.name ?? "";
  const variantName = productStock?.product_variants?.name;
  const title = isProduct
    ? `Stock mínimo — ${productName}${variantName && variantName !== "Unidad" ? ` — ${variantName}` : ""}`
    : `Stock mínimo — ${editingStock?.ingredients?.name ?? ""}`;

  return (
    <Modal title={title} open={open} onCancel={onClose} footer={null} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={onSubmit} className="mt-4">
        <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 13 }}>
          {isProduct
            ? "Cuando el stock en sucursal baje de este número, se mostrará una alerta."
            : "Cuando el stock baje de este número, se mostrará una alerta."}
        </Text>
        <Form.Item label="Cantidad mínima" name="min_quantity" rules={[{ required: true, message: "Requerido" }]}>
          <InputNumber min={0} style={{ width: "100%" }} addonAfter={isProduct ? "unidades" : undefined} />
        </Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" htmlType="submit">Guardar</Button>
        </div>
      </Form>
    </Modal>
  );
}
