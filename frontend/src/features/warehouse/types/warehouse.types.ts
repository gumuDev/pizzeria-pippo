export interface WarehouseRow {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  has_movements: boolean;
}

export type TransferType = "ingredient" | "product";

export type PurchaseType = "ingredient" | "product";

export interface ProductStockRow {
  id: string;
  variant_id: string;
  quantity: number;
  min_quantity: number;
  product_variants: {
    id: string;
    name: string;
    products: { id: string; name: string; is_active: boolean } | null;
  } | null;
}
