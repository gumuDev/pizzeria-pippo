import type { Dayjs } from "dayjs";

export interface Branch { id: string; name: string; }
export interface SalesSummary {
  total: number;
  count: number;
  avg: number;
  by_order_type: {
    dine_in: { total: number; count: number };
    takeaway: { total: number; count: number };
  };
}
export interface TopProduct {
  variant_id: string;
  product_name: string;
  variant_name: string;
  category: string;
  qty: number;
  revenue: number;
}
export interface DailyData { date: string; total: number; }
export interface StockAlert {
  id: string;
  quantity: number;
  min_quantity: number;
  ingredients: { name: string; unit: string };
  branches: { name: string };
}
export interface CashierReport {
  cashier_id: string;
  cashier_name: string;
  orders: number;
  total: number;
  items: TopProduct[];
}
export interface OrderItem {
  qty: number;
  unit_price: number;
  discount_applied: number;
  promo_label: string | null;
  product_variants: {
    name: string;
    products: { name: string; category: string } | null;
  } | null;
}
export interface Order {
  id: string;
  total: number;
  created_at: string;
  branch_id: string;
  cashier_name: string;
  payment_method: "efectivo" | "qr" | null;
  order_type: "dine_in" | "takeaway";
  branches: { name: string } | null;
  order_items: OrderItem[];
}

export interface ReportFilters {
  selectedBranch: string;
  dateRange: [Dayjs, Dayjs];
}
