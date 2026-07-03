"use client";

import { useState } from "react";
import { Modal, Input, Typography, Alert } from "antd";

const { TextArea } = Input;
const { Text } = Typography;

interface CancelTarget {
  id: string;
  daily_number: number;
}

interface Props {
  order: CancelTarget | null;
  loading: boolean;
  onConfirm: (orderId: string, reason: string) => void;
  onClose: () => void;
}

export function CancelOrderModal({ order, loading, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!order || !reason.trim()) return;
    onConfirm(order.id, reason.trim());
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const orderLabel = order ? `#${String(order.daily_number).padStart(2, "0")}` : "";

  return (
    <Modal
      open={!!order}
      title={<Text strong style={{ color: "#dc2626" }}>Anular orden {orderLabel}</Text>}
      okText="Anular orden"
      cancelText="Cancelar"
      okButtonProps={{ danger: true, loading, disabled: !reason.trim() }}
      onOk={handleConfirm}
      onCancel={handleClose}
      destroyOnClose
    >
      <Alert
        type="warning"
        showIcon
        message="Esta acción restaurará el stock automáticamente y no se puede deshacer."
        style={{ marginBottom: 16 }}
      />
      <TextArea
        placeholder="Motivo de anulación"
        maxLength={200}
        showCount
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        autoFocus
      />
    </Modal>
  );
}
