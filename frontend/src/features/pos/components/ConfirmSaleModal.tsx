"use client";

import { Modal, Button, Tag, Typography } from "antd";
import { ArrowLeftOutlined, CheckOutlined } from "@ant-design/icons";
import { PAYMENT_PROVIDERS } from "@pippo/shared";
import type { DiscountedItem } from "@/lib/promotions";
import type { PaymentMethod, SplitPayment } from "../types/pos.types";

const { Text } = Typography;

type OrderType = "dine_in" | "takeaway";

function paymentLabel(method: PaymentMethod, provider: string | null, payments: SplitPayment[] | null): string {
  if (method === "efectivo") return "💵 Efectivo";
  if (method === "qr") return "📱 QR";
  if (method === "mixto" && payments?.length) {
    return payments
      .map((p) => `${p.method === "efectivo" ? "💵" : "📱"} Bs ${p.amount.toFixed(2)}`)
      .join(" + ");
  }
  if (method === "online") {
    const known = provider ? PAYMENT_PROVIDERS[provider as keyof typeof PAYMENT_PROVIDERS] : undefined;
    return known ? `${known.emoji} ${known.label}` : "🌐 Pago online";
  }
  return "";
}

interface Props {
  open: boolean;
  discountedCart: DiscountedItem[];
  total: number;
  totalDiscount: number;
  paymentMethod: PaymentMethod;
  paymentProvider: string | null;
  payments?: SplitPayment[] | null;
  orderType: OrderType | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onValidatePayment?: () => void;
}

export function ConfirmSaleModal({ open, discountedCart, total, totalDiscount, paymentMethod, paymentProvider, payments, orderType, loading, onConfirm, onCancel, onValidatePayment }: Props) {
  return (
    <Modal
      title={
        <div>
          <div>Revisar y confirmar</div>
          <Text type="secondary" className="text-xs font-normal">Paso 2 de 2</Text>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={400}
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={onCancel}
              disabled={loading}
              style={{ flex: 1, height: 48 }}
            >
              Volver
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckOutlined />}
              loading={loading}
              onClick={onConfirm}
              style={{ flex: 2, height: 48, background: "#ea580c", borderColor: "#ea580c" }}
            >
              Confirmar y cobrar
            </Button>
          </div>
          {paymentMethod === "qr" && onValidatePayment && (
            <Button block disabled={loading} onClick={onValidatePayment}>
              Validar pago automáticamente
            </Button>
          )}
        </div>
      }
    >
      <div className="mt-3">
        {/* Total — what the cashier reads out loud */}
        <div className="flex flex-col items-center gap-3 bg-orange-50 rounded-lg px-4 py-4">
          <div className="text-center">
            <Text className="!text-orange-700 block text-sm">Total a cobrar</Text>
            <Text strong className="!text-orange-700" style={{ fontSize: 34, lineHeight: 1.2 }}>Bs {total.toFixed(2)}</Text>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1 bg-white rounded-full px-3 py-1 text-sm">
              {orderType === "takeaway" ? "🥡 Para llevar" : "🍽️ Comer aquí"}
            </span>
            {paymentMethod && (
              <span className="inline-flex items-center gap-1 bg-white rounded-full px-3 py-1 text-sm">
                {paymentLabel(paymentMethod, paymentProvider, payments ?? null)}
              </span>
            )}
          </div>
        </div>

        {/* Items */}
        <Text type="secondary" className="text-xs block mt-4 mb-2" style={{ letterSpacing: 0.5 }}>RESUMEN DE PRODUCTOS</Text>
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
          {discountedCart.map((item, idx) => (
            <div
              key={`${item.variant_id}-${idx}`}
              className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg"
              style={{ background: "#eff6ff" }}
            >
              <span
                className="min-w-7 h-7 inline-flex items-center justify-center rounded font-semibold text-sm text-white shrink-0"
                style={{ background: "#ea580c" }}
              >
                {item.qty_physical}×
              </span>
              <div className="flex-1 min-w-0">
                <Text>
                  {item.flavors?.length ? "Pizza mixta" : item.product_name}
                  {item.promo_label && <Tag color="red" className="!ml-1.5 !text-xs">{item.promo_label}</Tag>}
                </Text>
                <Text type="secondary" className="block text-xs">
                  {item.variant_name}
                  {item.flavors?.length ? ` · ${item.flavors.map((f) => f.product_name).join(" / ")}` : ""}
                </Text>
              </div>
              <Text strong>Bs {(item.unit_price * item.qty_physical - item.discount_applied).toFixed(2)}</Text>
            </div>
          ))}
        </div>

        {totalDiscount > 0 && (
          <div className="flex justify-between py-2 border-t text-green-600">
            <Text className="!text-green-600">🏷️ Descuentos aplicados</Text>
            <Text className="!text-green-600">− Bs {totalDiscount.toFixed(2)}</Text>
          </div>
        )}
      </div>
    </Modal>
  );
}
