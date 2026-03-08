export interface Branch { id: string; name: string; }
export interface Variant { id: string; name: string; product_name: string; }

export interface Rule {
  variant_id: string | null;
  buy_qty: number | null;
  get_qty: number | null;
  discount_percent: number | null;
  combo_price: number | null;
}

export interface Promotion {
  id: string;
  name: string;
  is_active: boolean;
  type: string;
  days_of_week: number[];
  start_date: string;
  end_date: string;
  branch_id: string | null;
  active: boolean;
  promotion_rules: Rule[];
}
