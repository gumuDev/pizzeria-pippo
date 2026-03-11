"use client";

import { Modal, Tag, Typography, Divider } from "antd";
import type { DiscountedItem } from "@/lib/promotions";

const { Text } = Typography;

type OrderType = "dine_in" | "takeaway";

interface Props {
  open: boolean;
  discountedCart: DiscountedItem[];
  total: number;
  totalDiscount: number;
  paymentMethod: "efectivo" | "qr" | null;
  orderType: OrderType | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSaleModal({ open, discountedCart, total, totalDiscount, paymentMethod, orderType, loading, onConfirm, onCancel }: Props) {
  return (
    <Modal
      title="Confirmar venta"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Confirmar y cobrar"
      cancelText="Volver"
      confirmLoading={loading}
      okButtonProps={{ size: "large" }}
    >
      <div className="mt-4">
        {discountedCart.map((item) => (
          <div key={item.variant_id} className="flex justify-between py-1 border-b last:border-0">
            <div>
              <Text>{item.qty_physical}x {item.product_name} ({item.variant_name})</Text>
              {item.promo_label && <Tag color="red" className="!ml-1 !text-xs">{item.promo_label}</Tag>}
            </div>
            <Text strong>Bs {(item.unit_price * item.qty_physical - item.discount_applied).toFixed(2)}</Text>
          </div>
        ))}
        {totalDiscount > 0 && (
          <div className="flex justify-between py-2 text-green-600">
            <Text>Descuentos aplicados</Text>
            <Text>- Bs {totalDiscount.toFixed(2)}</Text>
          </div>
        )}
        <Divider className="!my-2" />
        <div className="flex justify-between mb-2">
          <Text strong className="text-lg">Total a cobrar</Text>
          <Text strong className="text-xl text-orange-600">Bs {total.toFixed(2)}</Text>
        </div>
        <div className="flex justify-between text-gray-500 text-sm">
          <Text type="secondary">Tipo de pedido</Text>
          <Text>{orderType === "takeaway" ? "🥡 Para llevar" : "🍽️ Comer aquí"}</Text>
        </div>
        {paymentMethod && (
          <div className="flex justify-between text-gray-500 text-sm">
            <Text type="secondary">Método de pago</Text>
            <Text>{paymentMethod === "efectivo" ? "💵 Efectivo" : "📱 QR"}</Text>
          </div>
        )}
      </div>
    </Modal>
  );
}
