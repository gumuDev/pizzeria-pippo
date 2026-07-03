export interface TopProductResult {
  variant_id: string;
  product_name: string;
  variant_name: string;
  category: string;
  qty: number;
  revenue: number;
}

export interface CashierReportResult {
  cashier_id: string;
  cashier_name: string;
  orders: number;
  total: number;
  items: TopProductResult[];
}
