"use client";

import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { PosService } from "../services/pos.service";
import type { DayOrder } from "../types/pos.types";

export function useDayOrders(branchId: string | undefined, showOrders: boolean) {
  const [dayOrders, setDayOrders] = useState<DayOrder[]>([]);
  const [markingReady, setMarkingReady] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<DayOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchDayOrders = useCallback(async (bid: string) => {
    const data = await PosService.getDayOrders(bid);
    setDayOrders(data);
  }, []);

  useEffect(() => {
    if (showOrders && branchId) fetchDayOrders(branchId);
  }, [showOrders, branchId, fetchDayOrders]);

  // Realtime kitchen_status updates
  useEffect(() => {
    if (!branchId) return;
    const channel = PosService.subscribeToKitchenStatus(branchId, (payload) => {
      setDayOrders((prev) =>
        prev.map((o) => o.id === payload.new.id ? { ...o, kitchen_status: payload.new.kitchen_status } : o)
      );
    });
    return () => { PosService.unsubscribe(channel); };
  }, [branchId]);

  const handleMarkReady = async (orderId: string) => {
    setMarkingReady(orderId);
    await PosService.markOrderReady(orderId);
    setDayOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, kitchen_status: "ready" } : o)
    );
    setMarkingReady(null);
  };

  const openCancelModal = (order: DayOrder) => setCancelModal(order);
  const closeCancelModal = () => setCancelModal(null);

  const handleCancelOrder = async (orderId: string, reason: string) => {
    setCancelling(true);
    const result = await PosService.cancelOrder(orderId, reason);
    setCancelling(false);
    if (result.ok) {
      setDayOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, cancelled_at: new Date().toISOString() } : o)
      );
      setCancelModal(null);
      message.success("Orden anulada correctamente. Stock restaurado.");
    } else {
      message.error(result.error ?? "Error al anular la orden");
    }
  };

  return { dayOrders, markingReady, fetchDayOrders, handleMarkReady, cancelModal, cancelling, openCancelModal, closeCancelModal, handleCancelOrder };
}
