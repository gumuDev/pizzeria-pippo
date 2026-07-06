import { io, type Socket } from "socket.io-client";
import { supabase } from "@/lib/supabase";
import { getToken as _getToken, getValidSession } from "@/lib/auth";
import { todayInBolivia } from "@/lib/timezone";
import { BranchesService } from "@/features/branches/services/branches.service";
import type { Identity, Product, DayOrder, OrderType } from "../types/pos.types";
import type { Promotion, DiscountedItem, FlavorItem } from "@/lib/promotions";

const USE_NEST_PROMOTIONS = process.env.NEXT_PUBLIC_USE_NEST_PROMOTIONS === "true";
const USE_NEST_POS = process.env.NEXT_PUBLIC_USE_NEST_POS === "true";
const USE_NEST_REALTIME = process.env.NEXT_PUBLIC_USE_NEST_REALTIME === "true";
const NEST_API_URL = process.env.NEXT_PUBLIC_NEST_API_URL;

type KitchenStatusSubscription =
  | { kind: "supabase"; channel: ReturnType<typeof supabase.channel> }
  | { kind: "nest"; socket: Socket };

export const PosService = {
  async getToken(): Promise<string> {
    return _getToken();
  },

  async getBranches(): Promise<{ id: string; name: string }[]> {
    const branches = await BranchesService.getBranches();
    return branches
      .map((b) => ({ id: b.id, name: b.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getIdentity(): Promise<Identity | null> {
    const session = await getValidSession();
    if (!session) return null;
    const user = session.user;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, branch_id, full_name")
      .eq("id", user.id)
      .single();
    if (!profile) return null;
    return {
      id: user.id,
      name: profile.full_name ?? user.email ?? "",
      role: profile.role,
      branch_id: profile.branch_id,
    };
  },

  async getProductsAndPromotions(branchId: string, token: string): Promise<{ products: Product[]; promotions: Promotion[] }> {
    const today = todayInBolivia();
    const headers = { Authorization: `Bearer ${token}` };
    const promoUrl = USE_NEST_PROMOTIONS
      ? `${NEST_API_URL}/promotions?branchId=${branchId}&date=${today}`
      : `/api/promotions?branchId=${branchId}&date=${today}`;
    const productsUrl = USE_NEST_POS
      ? `${NEST_API_URL}/products/pos-catalog?branchId=${branchId}`
      : `/api/products?branchId=${branchId}`;
    const [productsRes, promoRes] = await Promise.all([
      fetch(productsUrl, { headers }),
      fetch(promoUrl, { headers }),
    ]);
    const [productsData, promoData] = await Promise.all([productsRes.json(), promoRes.json()]);
    return {
      products: Array.isArray(productsData) ? productsData : [],
      promotions: Array.isArray(promoData) ? promoData : [],
    };
  },

  async getDayOrders(branchId: string): Promise<DayOrder[]> {
    if (USE_NEST_POS) {
      const token = await PosService.getToken();
      const res = await fetch(`${NEST_API_URL}/orders?branchId=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }

    const today = todayInBolivia();
    const { data } = await supabase
      .from("orders")
      .select(`
        id, daily_number, created_at, total, kitchen_status, payment_method, order_type, cancelled_at,
        order_items (
          qty,
          product_variants ( name, products ( name ) )
        )
      `)
      .eq("branch_id", branchId)
      .gte("created_at", `${today}T00:00:00-04:00`)
      .lte("created_at", `${today}T23:59:59-04:00`)
      .order("created_at", { ascending: false });
    return (data as unknown as DayOrder[]) ?? [];
  },

  async confirmSale(
    branchId: string,
    discountedCart: DiscountedItem[],
    total: number,
    paymentMethod: "efectivo" | "qr" | null,
    orderType: OrderType,
    token: string,
    signal?: AbortSignal,
    idempotencyKey?: string
  ): Promise<{ ok: boolean; order_id?: string; daily_number?: number; error?: string }> {
    try {
      const url = USE_NEST_POS ? `${NEST_API_URL}/orders` : "/api/orders";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        signal,
        body: JSON.stringify({
          branch_id: branchId,
          total,
          payment_method: paymentMethod,
          order_type: orderType,
          idempotency_key: idempotencyKey ?? null,
          // The server recalculates prices, promos and physical units from
          // qty (paid units) — client-side amounts are only used to verify
          items: discountedCart.map((i) => ({
            variant_id: i.variant_id,
            qty: i.qty,
            flavors: (i.flavors as FlavorItem[] | undefined) ?? null,
          })),
        }),
      });
      if (res.ok) {
        const { order_id, daily_number } = await res.json();
        return { ok: true, order_id, daily_number };
      }
      const { error } = await res.json();
      return { ok: false, error };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { ok: false, error: "La solicitud fue cancelada (sin conexión o tiempo agotado)." };
      }
      return { ok: false, error: "Sin conexión. Verificá el internet e intentá de nuevo." };
    }
  },

  async markOrderReady(orderId: string): Promise<void> {
    const token = await PosService.getToken();
    const url = USE_NEST_POS ? `${NEST_API_URL}/orders/${orderId}/ready` : `/api/orders/${orderId}/ready`;
    await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  subscribeToKitchenStatus(
    branchId: string,
    onUpdate: (payload: { new: { id: string; kitchen_status: string } }) => void
  ): KitchenStatusSubscription {
    if (USE_NEST_REALTIME) {
      const socket: Socket = io(NEST_API_URL, {
        auth: (cb) => { PosService.getToken().then((token) => cb({ token })); },
        query: { branchId },
        transports: ["websocket"],
      });
      socket.on("order:updated", (payload: { id: string; kitchen_status: string }) => {
        onUpdate({ new: payload });
      });
      return { kind: "nest", socket };
    }

    const channel = supabase
      .channel("pos-kitchen-status")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `branch_id=eq.${branchId}`,
      }, onUpdate)
      .subscribe();
    return { kind: "supabase", channel };
  },

  unsubscribe(subscription: KitchenStatusSubscription) {
    if (subscription.kind === "nest") {
      subscription.socket.disconnect();
    } else {
      supabase.removeChannel(subscription.channel);
    }
  },

  async cancelOrder(orderId: string, reason: string, token: string): Promise<{ ok: boolean; error?: string }> {
    const url = USE_NEST_POS ? `${NEST_API_URL}/orders/${orderId}/cancel` : `/api/orders/${orderId}/cancel`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error ?? "Error al anular la orden" };
  },
};
