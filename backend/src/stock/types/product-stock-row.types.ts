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

export interface ResaleVariantRow {
  id: string;
  name: string;
  products: { id: string; name: string } | null;
}
