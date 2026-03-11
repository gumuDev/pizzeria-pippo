import { supabase } from "@/lib/supabase";
import { todayInBolivia } from "@/lib/timezone";
import type { Identity, Product, DayOrder, OrderType } from "../types/pos.types";
import type { Promotion, DiscountedItem } from "@/lib/promotions";

export const PosService = {
  async getToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  },

  async getIdentity(): Promise<Identity | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
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
    const [productsRes, promoRes] = await Promise.all([
      fetch("/api/products", { headers }),
      fetch(`/api/promotions?branchId=${branchId}&date=${today}`, { headers }),
    ]);
    const [productsData, promoData] = await Promise.all([productsRes.json(), promoRes.json()]);
    return {
      products: Array.isArray(productsData) ? productsData : [],
      promotions: Array.isArray(promoData) ? promoData : [],
    };
  },

  async getDayOrders(branchId: string): Promise<DayOrder[]> {
    const today = todayInBolivia();
    const { data } = await supabase
      .from("orders")
      .select(`
        id, daily_number, created_at, total, kitchen_status, payment_method, order_type,
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
    token: string
  ): Promise<{ ok: boolean; order_id?: string; daily_number?: number; error?: string }> {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        branch_id: branchId,
        total,
        payment_method: paymentMethod,
        order_type: orderType,
        items: discountedCart.map((i) => ({
          variant_id: i.variant_id,
          qty: i.qty_physical,
          qty_physical: i.qty_physical,
          unit_price: i.unit_price,
          discount_applied: i.discount_applied,
          promo_label: i.promo_label ?? null,
        })),
      }),
    });
    if (res.ok) {
      const { order_id, daily_number } = await res.json();
      return { ok: true, order_id, daily_number };
    }
    const { error } = await res.json();
    return { ok: false, error };
  },

  async markOrderReady(orderId: string): Promise<void> {
    await supabase.from("orders").update({ kitchen_status: "ready" }).eq("id", orderId);
  },
};
