export interface WarehouseStockRow {
  id: string;
  ingredient_id: string;
  quantity: number;
  min_quantity: number;
  updated_at: string;
  has_movements: boolean;
  ingredients: { name: string; unit: string };
}

export interface WarehouseStockListResult {
  data: WarehouseStockRow[];
  total: number;
  page: number;
  pageSize: number;
}
