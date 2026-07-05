export interface PosCatalogVariant {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
  stock_quantity?: number | null;
  recipes: { ingredient_id: string; quantity: number; apply_condition: string }[];
  branch_prices: { branch_id: string; price: number }[];
}

export interface PosCatalogProduct {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  product_type: string;
  product_variants: PosCatalogVariant[];
}
