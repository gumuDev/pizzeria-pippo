export interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

export interface Branch {
  id: string;
  name: string;
}

export type ApplyCondition = "always" | "takeaway" | "dine_in";

export interface VariantTypeOption {
  value: string;
  label: string;
}

export interface RecipeItem {
  ingredient_id: string;
  quantity: number;
  apply_condition: ApplyCondition;
}

export interface BranchPrice {
  branch_id: string;
  price: number;
}

export interface Variant {
  name: string;
  base_price: number;
  branch_prices: BranchPrice[];
  recipes: RecipeItem[];
}

// branch_id is set once at step 1 and applied to all variants
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  is_active: boolean;
  product_variants: Array<{ id: string; name: string; base_price: number }>;
}

export interface Step1Data {
  name: string;
  category: string;
  description: string;
  branch_id: string;
}
