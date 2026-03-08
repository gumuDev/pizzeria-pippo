export interface Branch { id: string; name: string; }
export interface Ingredient { id: string; name: string; unit: string; }

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
