// Ported 1:1 from frontend/src/lib/order-stock.ts (pure logic, no I/O) so the
// server-side stock deduction calculation stays in exact parity.
// create_order_atomic() applies these deductions transactionally.

export type OrderType = 'dine_in' | 'takeaway';

export interface RecipeRow {
  ingredient_id: string;
  quantity: number;
  apply_condition: string;
}

export interface StockItem {
  variant_id: string;
  qty_physical: number;
  product_type: string;
  flavors?: { variant_id: string; proportion: number }[] | null;
}

export interface StockDeductions {
  ingredient_deductions: { ingredient_id: string; quantity: number }[];
  resale_deductions: { variant_id: string; quantity: number }[];
}

function recipeApplies(recipe: RecipeRow, orderType: OrderType): boolean {
  const condition = recipe.apply_condition ?? 'always';
  return condition === 'always' || condition === orderType;
}

export function computeStockDeductions(
  items: StockItem[],
  recipesByVariant: Record<string, RecipeRow[]>,
  orderType: OrderType,
): StockDeductions {
  const ingredients: Record<string, number> = {};
  const resale: Record<string, number> = {};

  for (const item of items) {
    if (item.product_type === 'resale') {
      resale[item.variant_id] = (resale[item.variant_id] ?? 0) + item.qty_physical;
      continue;
    }

    const flavors = item.flavors ?? [];
    if (flavors.length > 0) {
      for (const flavor of flavors) {
        for (const recipe of recipesByVariant[flavor.variant_id] ?? []) {
          if (!recipeApplies(recipe, orderType)) continue;
          ingredients[recipe.ingredient_id] =
            (ingredients[recipe.ingredient_id] ?? 0) + recipe.quantity * item.qty_physical * flavor.proportion;
        }
      }
    } else {
      for (const recipe of recipesByVariant[item.variant_id] ?? []) {
        if (!recipeApplies(recipe, orderType)) continue;
        ingredients[recipe.ingredient_id] = (ingredients[recipe.ingredient_id] ?? 0) + recipe.quantity * item.qty_physical;
      }
    }
  }

  return {
    ingredient_deductions: Object.entries(ingredients).map(([ingredient_id, quantity]) => ({ ingredient_id, quantity })),
    resale_deductions: Object.entries(resale).map(([variant_id, quantity]) => ({ variant_id, quantity })),
  };
}
