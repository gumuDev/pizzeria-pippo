"use client";

import { Modal, Button, Spin, Typography } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { PaymentValidationState } from "../types/payment-validation.types";

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  state: PaymentValidationState;
  onConfirm: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export function PaymentValidationModal({ open, state, onConfirm, onReject, onCancel }: Props) {
  return (
    <Modal title="Validando pago" open={open} onCancel={onCancel} width={380} footer={null} closable={state.status !== "waiting"}>
      <div className="mt-3 flex flex-col items-center text-center gap-4 py-2">
        {state.status === "waiting" && (
          <>
            <Spin size="large" />
            <Text>Esperando a que llegue el pago...</Text>
            <Button onClick={onCancel}>Cancelar</Button>
          </>
        )}

        {state.status === "matched" && (
          <>
            <Text type="secondary">Se detectó un pago de</Text>
            <Title level={3} className="!m-0 !text-orange-600">Bs {state.amount.toFixed(2)}</Title>
            <Text>
              de <Text strong>{state.payerName}</Text>
            </Text>
            <Text type="secondary">¿Es el cliente?</Text>
            <div className="flex gap-2 w-full mt-2">
              <Button icon={<CloseOutlined />} onClick={onReject} style={{ flex: 1 }}>
                Actualizar
              </Button>
              <Button type="primary" icon={<CheckOutlined />} onClick={onConfirm} style={{ flex: 1, background: "#16a34a", borderColor: "#16a34a" }}>
                Vendido
              </Button>
            </div>
          </>
        )}

        {state.status === "timedOut" && (
          <>
            <Text>No se detectó el pago todavía.</Text>
            <div className="flex gap-2 w-full mt-2">
              <Button onClick={onCancel} style={{ flex: 1 }}>Cancelar</Button>
              <Button type="primary" onClick={onConfirm} style={{ flex: 1, background: "#ea580c", borderColor: "#ea580c" }}>
                Confirmar y cobrar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
