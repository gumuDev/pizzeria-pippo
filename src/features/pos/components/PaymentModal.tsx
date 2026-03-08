"use client";

import { Modal, Button } from "antd";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (method: "efectivo" | "qr" | null) => void;
}

export function PaymentModal({ open, onClose, onSelect }: Props) {
  return (
    <Modal
      title="¿Cómo pagó el cliente?"
      open={open}
      onCancel={onClose}
      footer={null}
      width={360}
    >
      <div className="flex flex-col gap-3 mt-4">
        <Button size="large" block className="h-14 text-base" onClick={() => onSelect("efectivo")}>
          💵 Efectivo
        </Button>
        <Button size="large" block className="h-14 text-base" onClick={() => onSelect("qr")}>
          📱 QR
        </Button>
        <Button size="large" block type="text" className="text-gray-400" onClick={() => onSelect(null)}>
          Confirmar sin especificar
        </Button>
      </div>
    </Modal>
  );
}
