export interface ProductCategory {
  id: string;
  name: string;
  allow_mixing: boolean;
  is_active: boolean;
  created_at: string;
}

export type ProductCategoryInput = Pick<ProductCategory, "name" | "allow_mixing">;
