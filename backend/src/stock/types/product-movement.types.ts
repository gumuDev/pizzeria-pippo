export interface ProductMovementRow {
  id: string;
  quantity: number;
  type: string;
  notes: string | null;
  created_at: string;
  product_variants: {
    id: string;
    name: string;
    products: { id: string; name: string } | null;
  } | null;
}

export interface ProductMovementListResult {
  data: ProductMovementRow[];
  total: number;
  page: number;
  pageSize: number;
}
