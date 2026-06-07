export interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

export interface Branch {
  id: string;
  name: string;
}

export type ProductType = "made" | "resale";

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

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  is_active: boolean;
  product_type: ProductType;
  product_variants: Array<{ id: string; name: string; base_price: number }>;
}

export interface Step1Data {
  name: string;
  category: string;
  description: string;
  product_type: ProductType;
}
