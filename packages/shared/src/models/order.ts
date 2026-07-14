export type OrderType = "dine_in" | "takeaway";
export type PaymentMethod = "efectivo" | "qr";
export type KitchenStatus = "pending" | "ready";

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  qty: number;
  qty_physical: number;
  unit_price: number;
  discount_applied: number;
  promo_label: string | null;
}

export interface Order {
  id: string;
  branch_id: string;
  cashier_id: string;
  total: number;
  created_at: string;
  kitchen_status: KitchenStatus;
  daily_number: number;
  payment_method: PaymentMethod | null;
  order_type: OrderType;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  order_items?: OrderItem[];
}
