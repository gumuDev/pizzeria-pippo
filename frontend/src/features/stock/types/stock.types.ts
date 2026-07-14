export interface Branch { id: string; name: string; }
export interface Ingredient { id: string; name: string; unit: string; }

export type StockType = "ingredient" | "product";

export interface StockRow {
  id: string;
  branch_id: string;
  ingredient_id: string;
  quantity: number;
  min_quantity: number;
  ingredients: Ingredient;
  branches: Branch;
}

export interface Movement {
  id: string;
  branch_id: string;
  ingredient_id: string;
  quantity: number;
  type: string;
  notes: string | null;
  created_at: string;
  ingredients?: Ingredient;
  branches?: Branch;
}

export interface ProductStockRow {
  id: string;
  variant_id: string;
  quantity: number;
  min_quantity: number;
  product_variants: {
    id: string;
    name: string;
    base_price: number;
    products: { id: string; name: string } | null;
  } | null;
}

export interface ProductVariantOption {
  variantId: string;
  productName: string;
  variantName: string;
}

export interface ProductMovement {
  id: string;
  branch_id: string;
  variant_id: string;
  quantity: number;
  type: string;
  notes: string | null;
  created_at: string;
  product_variants?: {
    id: string;
    name: string;
    products?: { id: string; name: string } | null;
  } | null;
}

export interface UnifiedMovement {
  id: string;
  created_at: string;
  detail: string;
  quantity: number;
  type: string;
  notes: string | null;
  origin: "insumo" | "reventa";
}

// Fila común para la tabla de "Stock actual" — une insumos y productos de
// reventa en una sola grilla, con `origin` como columna/filtro que los
// diferencia. `source` guarda la fila original para poder abrir el modal
// de mínimo correcto (StockRow vs ProductStockRow) sin duplicar esa lógica.
export type UnifiedStockRow =
  | { id: string; origin: "insumo"; name: string; secondaryName?: string; unit: string; quantity: number; min_quantity: number; source: StockRow }
  | { id: string; origin: "reventa"; name: string; secondaryName?: string; unit: string; quantity: number; min_quantity: number; source: ProductStockRow };
