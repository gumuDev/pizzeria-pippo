export interface MovementRow {
  id: string;
  branch_id: string;
  ingredient_id: string;
  quantity: number;
  type: string;
  notes: string | null;
  created_at: string;
  ingredients: { id: string; name: string; unit: string };
  branches: { id: string; name: string };
}

export interface MovementListResult {
  data: MovementRow[];
  total: number;
  page: number;
  pageSize: number;
}
