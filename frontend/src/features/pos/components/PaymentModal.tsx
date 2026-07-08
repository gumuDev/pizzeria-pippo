"use client";

import { useState } from "react";
import { Modal, Button, Typography } from "antd";
import { CheckCircleFilled, ArrowRightOutlined } from "@ant-design/icons";

const { Text } = Typography;

type OrderType = "dine_in" | "takeaway";
type PaymentMethod = "efectivo" | "qr" | null;

interface Props {
  open: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (orderType: OrderType, paymentMethod: PaymentMethod) => void;
}

interface OptionCardProps {
  selected: boolean;
  emoji: string;
  label: string;
  accent: "orange" | "blue";
  onClick: () => void;
}

function OptionCard({ selected, emoji, label, accent, onClick }: OptionCardProps) {
  const colors =
    accent === "orange"
      ? { border: "#f97316", bg: "#fff7ed", text: "#ea580c" }
      : { border: "#3b82f6", bg: "#eff6ff", text: "#2563eb" };
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-lg py-3 px-2 text-center cursor-pointer relative"
      style={{
        border: selected ? `2px solid ${colors.border}` : "1px solid #d1d5db",
        background: selected ? colors.bg : "#fff",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {selected && (
        <CheckCircleFilled
          style={{ position: "absolute", top: 6, right: 8, color: colors.text, fontSize: 16 }}
        />
      )}
      <div className="text-2xl">{emoji}</div>
      <div
        className="text-sm mt-1"
        style={{ color: selected ? colors.text : "#374151", fontWeight: selected ? 600 : 400 }}
      >
        {label}
      </div>
    </button>
  );
}

export function PaymentModal({ open, total, onClose, onConfirm }: Props) {
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  const handleClose = () => {
    setOrderType(null);
    setPaymentMethod(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!orderType) return;
    onConfirm(orderType, paymentMethod);
    setOrderType(null);
    setPaymentMethod(null);
  };

  return (
    <Modal
      title={
        <div>
          <div>Tipo de pedido y pago</div>
          <Text type="secondary" className="text-xs font-normal">Paso 1 de 2</Text>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={400}
    >
      <div className="flex flex-col gap-4 mt-3">
        {/* Total — the cashier reads it out loud when asking for payment */}
        <div className="flex justify-between items-center bg-orange-50 rounded-lg px-4 py-2.5">
          <Text className="!text-orange-700">Total del pedido</Text>
          <Text strong className="!text-orange-700 text-2xl">Bs {total.toFixed(2)}</Text>
        </div>

        {/* Order type — required */}
        <div>
          <Text strong className="block mb-2">¿Cómo va el pedido? <Text type="danger">*</Text></Text>
          <div className="flex gap-3">
            <OptionCard
              selected={orderType === "dine_in"}
              emoji="🍽️"
              label="Comer aquí"
              accent="orange"
              onClick={() => setOrderType("dine_in")}
            />
            <OptionCard
              selected={orderType === "takeaway"}
              emoji="🥡"
              label="Para llevar"
              accent="orange"
              onClick={() => setOrderType("takeaway")}
            />
          </div>
          {!orderType && (
            <Text type="secondary" className="text-xs mt-1 block">Seleccioná una opción para continuar</Text>
          )}
        </div>

        {/* Payment method — optional */}
        <div>
          <Text strong className="block mb-2">¿Cómo pagó el cliente? <Text type="secondary" className="font-normal">(opcional)</Text></Text>
          <div className="flex gap-3">
            <OptionCard
              selected={paymentMethod === "efectivo"}
              emoji="💵"
              label="Efectivo"
              accent="blue"
              onClick={() => setPaymentMethod(paymentMethod === "efectivo" ? null : "efectivo")}
            />
            <OptionCard
              selected={paymentMethod === "qr"}
              emoji="📱"
              label="QR"
              accent="blue"
              onClick={() => setPaymentMethod(paymentMethod === "qr" ? null : "qr")}
            />
          </div>
          <Text type="secondary" className="text-xs mt-1 block">Toca de nuevo para quitar la selección</Text>
        </div>

        <Button
          type="primary"
          size="large"
          block
          disabled={!orderType}
          onClick={handleConfirm}
          style={
            orderType
              ? { height: 48, fontSize: 16, background: "#ea580c", borderColor: "#ea580c" }
              : { height: 48, fontSize: 16 }
          }
        >
          Continuar <ArrowRightOutlined />
        </Button>
      </div>
    </Modal>
  );
}
