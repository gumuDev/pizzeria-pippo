import type { Ingredient } from '@pippo/shared';

export interface IngredientListResult {
  data: Ingredient[];
  total: number;
  page: number;
  pageSize: number;
}
