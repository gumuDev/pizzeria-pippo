export type PromotionType = "BUY_X_GET_Y" | "PERCENTAGE" | "COMBO";
export type PromotionRuleCategory = "pizza" | "bebida" | "otro";
export type PromotionRuleVariantSize = "Personal" | "Mediana" | "Familiar";

export interface PromotionRule {
  id: string;
  promotion_id: string;
  variant_id: string | null;
  buy_qty: number | null;
  get_qty: number | null;
  discount_percent: number | null;
  combo_price: number | null;
  category: PromotionRuleCategory | null;
  variant_size: PromotionRuleVariantSize | null;
}

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  days_of_week: number[];
  start_date: string;
  end_date: string;
  branch_id: string | null;
  active: boolean;
  created_at: string;
  promotion_rules?: PromotionRule[];
}
