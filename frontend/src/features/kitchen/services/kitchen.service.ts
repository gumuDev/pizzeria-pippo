import { io, type Socket } from "socket.io-client";
import { supabase } from "@/lib/supabase";
import { getToken } from "@/lib/auth";
import type { KitchenOrder } from "../types/kitchen.types";

const USE_NEST = process.env.NEXT_PUBLIC_USE_NEST_SETTINGS === "true";
const USE_NEST_REALTIME = process.env.NEXT_PUBLIC_USE_NEST_REALTIME === "true";
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

type OrderUpdatePayload = { new: { id: string; kitchen_status: string; cancelled_at: string | null } };

type OrdersSubscription =
  | { kind: "supabase"; channel: ReturnType<typeof supabase.channel> }
  | { kind: "nest"; socket: Socket };

export const KitchenService = {
  // Antes de NEXT_PUBLIC_USE_NEST_SETTINGS, esto leía app_settings directo con
  // el cliente anon de Supabase, bloqueado por RLS (admin-only) para el rol
  // cocinero — el umbral nunca llegaba a la pantalla de cocina real (bugs/03).
  // Con el flag activo pega a un endpoint sin restricción de rol.
  async getLateThresholdMinutes(): Promise<number | null> {
    if (USE_NEST) {
      const token = await getToken();
      const res = await fetch(`${NEST_API_URL}/settings/kitchen-threshold`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.kitchen_late_threshold_minutes ?? null;
    }

    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "kitchen_late_threshold_minutes")
      .single();
    return data?.value ? parseInt(data.value, 10) : null;
  },

  async getBranchName(branchId: string): Promise<string | null> {
    const { data } = await supabase
      .from("branches")
      .select("name")
      .eq("id", branchId)
      .single();
    return data?.name ?? null;
  },

  async getPendingOrders(branchId: string): Promise<KitchenOrder[]> {
    const { data } = await supabase
      .from("orders")
      .select(`
        id, daily_number, created_at, kitchen_status, order_type,
        order_items (
          id, qty, qty_physical,
          product_variants (
            name,
            products ( name, description )
          ),
          order_item_flavors (
            variant_id, proportion,
            product_variants ( products ( name ) )
          )
        )
      `)
      .eq("branch_id", branchId)
      .eq("kitchen_status", "pending")
      .is("cancelled_at", null)
      .order("created_at", { ascending: true });

    return (data as unknown as KitchenOrder[]) ?? [];
  },

  async markOrderReady(orderId: string): Promise<void> {
    // Must go through the Nest endpoint when USE_NEST_REALTIME is on — that's
    // the only place that emits order:updated to the Gateway; writing to
    // Supabase directly would silently skip notifying the POS.
    if (USE_NEST_REALTIME) {
      const token = await getToken();
      await fetch(`${NEST_API_URL}/orders/${orderId}/ready`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      return;
    }

    await supabase.from("orders").update({ kitchen_status: "ready" }).eq("id", orderId);
  },

  subscribeToOrders(
    branchId: string,
    onInsert: () => void,
    onUpdate: (payload: OrderUpdatePayload) => void
  ): OrdersSubscription {
    if (USE_NEST_REALTIME) {
      const socket: Socket = io(NEST_API_URL, {
        auth: (cb) => { getToken().then((token) => cb({ token })); },
        query: { branchId },
        transports: ["websocket"],
      });
      socket.on("order:created", onInsert);
      socket.on("order:updated", (payload: { id: string; kitchen_status: string; cancelled_at: string | null }) => {
        onUpdate({ new: payload });
      });

      return { kind: "nest", socket };
    }

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `branch_id=eq.${branchId}` },
        onInsert
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `branch_id=eq.${branchId}` },
        onUpdate
      )
      .subscribe();

    return { kind: "supabase", channel };
  },

  unsubscribe(subscription: OrdersSubscription) {
    if (subscription.kind === "nest") {
      subscription.socket.disconnect();
    } else {
      supabase.removeChannel(subscription.channel);
    }
  },
};
