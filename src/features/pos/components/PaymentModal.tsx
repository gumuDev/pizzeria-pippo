"use client";

import { useState } from "react";
import { Modal, Button, Divider, Typography } from "antd";

const { Text } = Typography;

type OrderType = "dine_in" | "takeaway";
type PaymentMethod = "efectivo" | "qr" | null;

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (orderType: OrderType, paymentMethod: PaymentMethod) => void;
}

const selectedOrderStyle: React.CSSProperties = {
  background: "#fff7ed",
  borderColor: "#f97316",
  color: "#ea580c",
  fontWeight: 600,
};

const selectedPaymentStyle: React.CSSProperties = {
  background: "#eff6ff",
  borderColor: "#3b82f6",
  color: "#2563eb",
  fontWeight: 600,
};

export function PaymentModal({ open, onClose, onConfirm }: Props) {
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
      title="Confirmar venta"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={400}
    >
      <div className="flex flex-col gap-5 mt-4">

        {/* Tipo de pedido — obligatorio */}
        <div>
          <Text strong className="block mb-2">¿Cómo va el pedido? <Text type="danger">*</Text></Text>
          <div className="flex gap-3">
            <Button
              size="large"
              block
              style={orderType === "dine_in" ? selectedOrderStyle : {}}
              onClick={() => setOrderType("dine_in")}
            >
              🍽️ Comer aquí
            </Button>
            <Button
              size="large"
              block
              style={orderType === "takeaway" ? selectedOrderStyle : {}}
              onClick={() => setOrderType("takeaway")}
            >
              🥡 Para llevar
            </Button>
          </div>
          {!orderType && (
            <Text type="secondary" className="text-xs mt-1 block">Seleccioná una opción para continuar</Text>
          )}
        </div>

        <Divider className="!my-0" />

        {/* Método de pago — opcional */}
        <div>
          <Text strong className="block mb-2">¿Cómo pagó el cliente? <Text type="secondary" className="font-normal">(opcional)</Text></Text>
          <div className="flex gap-3">
            <Button
              size="large"
              block
              style={paymentMethod === "efectivo" ? selectedPaymentStyle : {}}
              onClick={() => setPaymentMethod(paymentMethod === "efectivo" ? null : "efectivo")}
            >
              💵 Efectivo
            </Button>
            <Button
              size="large"
              block
              style={paymentMethod === "qr" ? selectedPaymentStyle : {}}
              onClick={() => setPaymentMethod(paymentMethod === "qr" ? null : "qr")}
            >
              📱 QR
            </Button>
          </div>
          {!paymentMethod && (
            <Text type="secondary" className="text-xs mt-1 block">Sin especificar si no se selecciona</Text>
          )}
        </div>

        <Button
          type="primary"
          size="large"
          block
          disabled={!orderType}
          onClick={handleConfirm}
          style={{ height: 48, fontSize: 16 }}
        >
          Confirmar venta
        </Button>
      </div>
    </Modal>
  );
}
