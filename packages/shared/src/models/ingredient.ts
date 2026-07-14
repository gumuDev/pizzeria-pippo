export type IngredientUnit = "g" | "kg" | "ml" | "l" | "unidad";

export interface Ingredient {
  id: string;
  name: string;
  unit: IngredientUnit;
  created_at: string;
  is_active: boolean;
  is_shared_use: boolean;
}
