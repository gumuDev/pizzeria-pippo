"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PosService } from "../services/pos.service";
import type { DayOrder } from "../types/pos.types";

export function useDayOrders(branchId: string | undefined, showOrders: boolean) {
  const [dayOrders, setDayOrders] = useState<DayOrder[]>([]);
  const [markingReady, setMarkingReady] = useState<string | null>(null);

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
    const channel = supabase
      .channel("pos-kitchen-status")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `branch_id=eq.${branchId}`,
      }, (payload) => {
        setDayOrders((prev) =>
          prev.map((o) => o.id === payload.new.id ? { ...o, kitchen_status: payload.new.kitchen_status } : o)
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [branchId]);

  const handleMarkReady = async (orderId: string) => {
    setMarkingReady(orderId);
    await PosService.markOrderReady(orderId);
    setMarkingReady(null);
  };

  return { dayOrders, markingReady, fetchDayOrders, handleMarkReady };
}
