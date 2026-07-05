import { computeStockDeductions } from './order-stock';
import type { RecipeRow, StockItem } from './order-stock';

const pizzaRecipe: RecipeRow[] = [
  { ingredient_id: 'masa', quantity: 1, apply_condition: 'always' },
  { ingredient_id: 'queso', quantity: 200, apply_condition: 'always' },
  { ingredient_id: 'caja', quantity: 1, apply_condition: 'takeaway' },
];

function makeItem(overrides: Partial<StockItem> = {}): StockItem {
  return { variant_id: 'v-haw', qty_physical: 1, product_type: 'made', ...overrides };
}

describe('computeStockDeductions — made products', () => {
  it('deducts the full recipe multiplied by physical qty', () => {
    const result = computeStockDeductions([makeItem({ qty_physical: 2 })], { 'v-haw': pizzaRecipe }, 'dine_in');
    expect(result.ingredient_deductions).toEqual(
      expect.arrayContaining([
        { ingredient_id: 'masa', quantity: 2 },
        { ingredient_id: 'queso', quantity: 400 },
      ]),
    );
    expect(result.resale_deductions).toHaveLength(0);
  });

  it('respects apply_condition: takeaway-only ingredients skip dine_in orders', () => {
    const dineIn = computeStockDeductions([makeItem()], { 'v-haw': pizzaRecipe }, 'dine_in');
    expect(dineIn.ingredient_deductions.find((d) => d.ingredient_id === 'caja')).toBeUndefined();

    const takeaway = computeStockDeductions([makeItem()], { 'v-haw': pizzaRecipe }, 'takeaway');
    expect(takeaway.ingredient_deductions).toContainEqual({ ingredient_id: 'caja', quantity: 1 });
  });

  it('aggregates the same ingredient across items', () => {
    const result = computeStockDeductions(
      [makeItem(), makeItem({ variant_id: 'v-pep' })],
      { 'v-haw': pizzaRecipe, 'v-pep': [{ ingredient_id: 'queso', quantity: 150, apply_condition: 'always' }] },
      'dine_in',
    );
    expect(result.ingredient_deductions).toContainEqual({ ingredient_id: 'queso', quantity: 350 });
  });

  it('uses flavor recipes weighted by proportion for mixed pizzas', () => {
    const result = computeStockDeductions(
      [
        makeItem({
          variant_id: 'v-mixta',
          flavors: [
            { variant_id: 'v-haw', proportion: 0.5 },
            { variant_id: 'v-pep', proportion: 0.5 },
          ],
        }),
      ],
      {
        'v-haw': [{ ingredient_id: 'pina', quantity: 100, apply_condition: 'always' }],
        'v-pep': [{ ingredient_id: 'pepperoni', quantity: 80, apply_condition: 'always' }],
      },
      'dine_in',
    );
    expect(result.ingredient_deductions).toContainEqual({ ingredient_id: 'pina', quantity: 50 });
    expect(result.ingredient_deductions).toContainEqual({ ingredient_id: 'pepperoni', quantity: 40 });
  });

  it('returns nothing for variants without recipes', () => {
    const result = computeStockDeductions([makeItem()], {}, 'dine_in');
    expect(result.ingredient_deductions).toHaveLength(0);
  });
});

describe('computeStockDeductions — resale products', () => {
  it('deducts physical units per variant without touching ingredients', () => {
    const result = computeStockDeductions(
      [
        makeItem({ variant_id: 'v-coca', product_type: 'resale', qty_physical: 3 }),
        makeItem({ variant_id: 'v-coca', product_type: 'resale', qty_physical: 1 }),
      ],
      {},
      'dine_in',
    );
    expect(result.resale_deductions).toEqual([{ variant_id: 'v-coca', quantity: 4 }]);
    expect(result.ingredient_deductions).toHaveLength(0);
  });
});
