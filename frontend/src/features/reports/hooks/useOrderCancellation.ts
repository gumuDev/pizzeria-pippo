"use client";

import { useState } from "react";
import { message } from "antd";
import { ReportsService } from "../services/reports.service";
import type { Order } from "../types/reports.types";

export function useOrderCancellation(onSuccess: () => void) {
  const [cancelModal, setCancelModal] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const openCancelModal = (order: Order) => setCancelModal(order);
  const closeCancelModal = () => setCancelModal(null);

  const handleCancel = async (orderId: string, reason: string) => {
    setCancelling(true);
    const token = await ReportsService.getToken();
    const result = await ReportsService.cancelOrder(orderId, reason, token);
    setCancelling(false);
    if (result.ok) {
      setCancelModal(null);
      message.success("Orden anulada correctamente. Stock restaurado.");
      onSuccess();
    } else {
      message.error(result.error ?? "Error al anular la orden");
    }
  };

  return { cancelModal, cancelling, openCancelModal, closeCancelModal, handleCancel };
}
