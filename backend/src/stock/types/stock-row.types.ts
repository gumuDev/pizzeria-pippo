export interface StockRow {
  id: string;
  branch_id: string;
  ingredient_id: string;
  quantity: number;
  min_quantity: number;
  ingredients: { id: string; name: string; unit: string };
  branches: { id: string; name: string };
}

export interface StockListResult {
  data: StockRow[];
  total: number;
  page: number;
  pageSize: number;
}
