import type { Product, ProductType, ProductCategory, RecipeItem, RecipeApplyCondition } from "@pippo/shared";

export type { Product, ProductType, ProductCategory, RecipeItem };
export type ApplyCondition = RecipeApplyCondition;

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

export interface Branch {
  id: string;
  name: string;
}

export interface VariantTypeOption {
  value: string;
  label: string;
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
  is_active?: boolean;
}

export interface Step1Data {
  name: string;
  category: string;
  description: string;
  product_type: ProductType;
}
