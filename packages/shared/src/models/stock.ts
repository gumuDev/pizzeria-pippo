export interface BranchStock {
  id: string;
  branch_id: string;
  ingredient_id: string;
  quantity: number;
  min_quantity: number;
  updated_at: string;
}

export interface WarehouseStock {
  id: string;
  ingredient_id: string;
  quantity: number;
  min_quantity: number;
  updated_at: string;
}
