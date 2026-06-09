"use client";

import { Modal, Button, Tag, Typography } from "antd";
import { ArrowLeftOutlined, CheckOutlined } from "@ant-design/icons";
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
      }
    >
      <div className="mt-3">
        {/* Total — what the cashier reads out loud */}
        <div className="flex justify-between items-center bg-orange-50 rounded-lg px-4 py-3">
          <Text className="!text-orange-700">Total a cobrar</Text>
          <Text strong className="!text-orange-700 text-3xl">Bs {total.toFixed(2)}</Text>
        </div>

        {/* Order type + payment chips — verify before confirming */}
        <div className="flex gap-2 mt-3">
          <span className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm">
            {orderType === "takeaway" ? "🥡 Para llevar" : "🍽️ Comer aquí"}
          </span>
          {paymentMethod && (
            <span className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm">
              {paymentMethod === "efectivo" ? "💵 Efectivo" : "📱 QR"}
            </span>
          )}
        </div>

        {/* Items */}
        <div className="mt-3 border-t max-h-56 overflow-y-auto">
          {discountedCart.map((item, idx) => (
            <div key={`${item.variant_id}-${idx}`} className="flex items-center gap-2.5 py-2 border-b last:border-b-0">
              <span className="min-w-7 h-7 inline-flex items-center justify-center bg-gray-100 rounded font-semibold text-sm">
                {item.qty_physical}×
              </span>
              <div className="flex-1 min-w-0">
                <Text>
                  {item.flavors?.length ? "Producto mixto" : item.product_name}
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
