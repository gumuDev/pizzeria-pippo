"use client";

import { Modal, Button, Tag, Typography, Divider } from "antd";
import type { TicketData } from "../types/pos.types";

const { Text } = Typography;

interface Props {
  ticket: TicketData | null;
  onClose: () => void;
}

export function TicketModal({ ticket, onClose }: Props) {
  return (
    <Modal
      title="✅ Venta confirmada"
      open={!!ticket}
      onCancel={onClose}
      footer={
        <Button type="primary" size="large" block onClick={onClose}>
          Nueva venta
        </Button>
      }
      width={400}
    >
      {ticket && (
        <div className="mt-4">
          <div className="text-center mb-4">
            <Text strong className="text-4xl text-orange-600">
              #{String(ticket.dailyNumber).padStart(2, "0")}
            </Text>
          </div>
          {ticket.items.map((item) => (
            <div key={item.variant_id} className="flex justify-between py-1 border-b last:border-0">
              <div>
                <Text>{item.qty_physical}x {item.product_name} ({item.variant_name})</Text>
                {item.promo_label && <Tag color="red" className="!ml-1 !text-xs">{item.promo_label}</Tag>}
              </div>
              <Text>Bs {(item.unit_price * item.qty_physical - item.discount_applied).toFixed(2)}</Text>
            </div>
          ))}
          <Divider className="!my-2" />
          <div className="flex justify-between mb-1">
            <Text strong>Total cobrado</Text>
            <Text strong className="text-orange-600">Bs {ticket.total.toFixed(2)}</Text>
          </div>
          <div className="flex justify-between">
            <Text type="secondary">Método de pago</Text>
            <Text>
              {ticket.paymentMethod === "efectivo" ? "💵 Efectivo"
                : ticket.paymentMethod === "qr" ? "📱 QR"
                : "—"}
            </Text>
          </div>
        </div>
      )}
    </Modal>
  );
}
