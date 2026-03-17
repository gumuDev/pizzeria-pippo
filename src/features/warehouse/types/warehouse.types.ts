export interface WarehouseRow {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  has_movements: boolean;
}
