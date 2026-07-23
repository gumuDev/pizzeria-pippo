"use client";

import { Modal, Button, Tag, Typography, Divider } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { PAYMENT_PROVIDERS } from "@pippo/shared";
import type { TicketData } from "../types/pos.types";

const { Text } = Typography;

function paymentLabel(method: TicketData["paymentMethod"], provider: string | null, payments: TicketData["payments"]): string {
  if (method === "efectivo") return "💵 Efectivo";
  if (method === "qr") return "📱 QR";
  if (method === "mixto" && payments?.length) {
    return payments.map((p) => `${p.method === "efectivo" ? "💵" : "📱"} Bs ${p.amount.toFixed(2)}`).join(" + ");
  }
  if (method === "online") {
    const known = provider ? PAYMENT_PROVIDERS[provider as keyof typeof PAYMENT_PROVIDERS] : undefined;
    return known ? `${known.emoji} ${known.label}` : "🌐 Pago online";
  }
  return "—";
}

interface Props {
  ticket: TicketData | null;
  onClose: () => void;
  onPrint?: () => void;
  printing?: boolean;
  canPrint?: boolean;
}

export function TicketModal({ ticket, onClose, onPrint, printing, canPrint }: Props) {
  return (
    <Modal
      title="✅ Venta confirmada"
      open={!!ticket}
      onCancel={onClose}
      footer={
        <div style={{ display: "flex", gap: 8 }}>
          {canPrint && onPrint && (
            <Button
              size="large"
              icon={<PrinterOutlined />}
              loading={printing}
              onClick={onPrint}
              style={{ flex: 1 }}
            >
              Imprimir
            </Button>
          )}
          <Button type="primary" size="large" onClick={onClose} style={{ flex: 2 }}>
            Nueva venta
          </Button>
        </div>
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
          {ticket.items.map((item, idx) => (
            <div key={`${item.variant_id}-${idx}`} className="flex justify-between py-1 border-b last:border-0">
              <div>
                <Text>
                  {item.qty_physical}x {item.product_name}
                  {item.flavors?.length
                    ? ` — Mit. ${item.flavors[0].product_name} / Mit. ${item.flavors[1].product_name}`
                    : ` (${item.variant_name})`}
                </Text>
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
            <Text>{paymentLabel(ticket.paymentMethod, ticket.paymentProvider, ticket.payments)}</Text>
          </div>
        </div>
      )}
    </Modal>
  );
}
