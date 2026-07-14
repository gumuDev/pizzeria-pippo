export interface PromotionRuleResult {
  id: string;
  promotion_id: string;
  variant_id: string | null;
  buy_qty: number | null;
  get_qty: number | null;
  discount_percent: number | null;
  combo_price: number | null;
  category: string | null;
  variant_size: string | null;
}

export interface PromotionResult {
  id: string;
  name: string;
  type: string;
  days_of_week: number[];
  start_date: string;
  end_date: string;
  branch_id: string | null;
  active: boolean;
  is_active: boolean;
  created_at: string;
  promotion_rules: PromotionRuleResult[];
}
