import type { DiscountedItem } from "@/lib/promotions";

export interface Variant {
  id: string;
  name: string;
  base_price: number;
  branch_prices: { branch_id: string; price: number }[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  product_variants: Variant[];
}

export interface Identity {
  id: string;
  name: string;
  role: string;
  branch_id: string;
}

export interface DayOrder {
  id: string;
  daily_number: number;
  created_at: string;
  total: number;
  kitchen_status: string;
  payment_method: "efectivo" | "qr" | null;
  order_items: {
    qty: number;
    product_variants: { name: string; products: { name: string } | null } | null;
  }[];
}

export interface TicketData {
  orderId: string;
  dailyNumber: number;
  items: DiscountedItem[];
  total: number;
  paymentMethod: "efectivo" | "qr" | null;
}
