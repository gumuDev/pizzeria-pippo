import { createClient } from "@supabase/supabase-js";

type OrderType = "dine_in" | "takeaway";

/**
 * Deducts ingredients from branch_stock based on the recipes of each order item.
 * Only deducts ingredients whose apply_condition matches the order type:
 *   - 'always'   → always deducted
 *   - 'takeaway' → only when orderType = 'takeaway'
 *   - 'dine_in'  → only when orderType = 'dine_in'
 * Records a stock_movement of type 'venta' for each deduction.
 * Called server-side after an order is confirmed.
 */
export async function deductStock(
  orderId: string,
  branchId: string,
  token: string,
  userId: string | null = null,
  orderType: OrderType = "dine_in"
): Promise<{ success: boolean; error?: string }> {
  // Use service role to bypass RLS for stock updates — deduction is always server-side after auth check
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch order items with their variant recipes and flavor rows (for mixed pizzas)
  // qty_physical = units actually prepared (used for stock deduction)
  // qty          = units charged (may be less when BUY_X_GET_Y promo applies)
  const { data: orderItems, error: orderError } = await supabase
    .from("order_items")
    .select(`
      qty, qty_physical, variant_id,
      product_variants(recipes(ingredient_id, quantity, apply_condition)),
      order_item_flavors(variant_id, proportion)
    `)
    .eq("order_id", orderId);

  if (orderError) return { success: false, error: orderError.message };
  if (!orderItems?.length) return { success: true };

  type Recipe = { ingredient_id: string; quantity: number; apply_condition: string };
  type FlavorRow = { variant_id: string; proportion: number };

  // 2. Aggregate total deduction per ingredient using qty_physical
  // Mixed pizzas: deduct each flavor's recipe proportionally
  const deductions: Record<string, number> = {};
  for (const item of orderItems) {
    const physicalQty = (item as { qty_physical?: number }).qty_physical ?? item.qty;
    const flavors = (item as unknown as { order_item_flavors: FlavorRow[] }).order_item_flavors ?? [];

    if (flavors.length > 0) {
      // Mixed pizza: fetch each flavor's recipe and apply proportion
      for (const flavor of flavors) {
        const { data: flavorVariant } = await supabase
          .from("product_variants")
          .select("recipes(ingredient_id, quantity, apply_condition)")
          .eq("id", flavor.variant_id)
          .single();
        const recipes: Recipe[] = (flavorVariant as unknown as { recipes: Recipe[] } | null)?.recipes ?? [];
        for (const recipe of recipes) {
          const condition = recipe.apply_condition ?? "always";
          if (condition !== "always" && condition !== orderType) continue;
          deductions[recipe.ingredient_id] = (deductions[recipe.ingredient_id] ?? 0) + recipe.quantity * physicalQty * flavor.proportion;
        }
      }
    } else {
      // Normal pizza: deduct 100% of the recipe
      const recipes: Recipe[] = (item.product_variants as unknown as { recipes: Recipe[] })?.recipes ?? [];
      for (const recipe of recipes) {
        const condition = recipe.apply_condition ?? "always";
        if (condition !== "always" && condition !== orderType) continue;
        deductions[recipe.ingredient_id] = (deductions[recipe.ingredient_id] ?? 0) + recipe.quantity * physicalQty;
      }
    }
  }

  const ingredientIds = Object.keys(deductions);
  if (!ingredientIds.length) return { success: true };

  // 3. Fetch all affected stock rows in one query
  const { data: stockRows, error: stockError } = await supabase
    .from("branch_stock")
    .select("id, ingredient_id, quantity")
    .eq("branch_id", branchId)
    .in("ingredient_id", ingredientIds);

  if (stockError) return { success: false, error: stockError.message };

  // 4. Update each stock row and batch-insert movements in parallel
  const updatePromises = (stockRows ?? []).map((stock) => {
    const amount = deductions[stock.ingredient_id] ?? 0;
    return supabase
      .from("branch_stock")
      .update({ quantity: stock.quantity - amount })
      .eq("id", stock.id);
  });

  const movements = ingredientIds.map((ingredientId) => ({
    branch_id: branchId,
    ingredient_id: ingredientId,
    quantity: -deductions[ingredientId],
    type: "venta" as const,
    notes: `Orden ${orderId}`,
    created_by: userId,
  }));

  const [updateResults, movError] = await Promise.all([
    Promise.all(updatePromises),
    supabase.from("stock_movements").insert(movements).then((r) => r.error),
  ]);

  for (const result of updateResults) {
    if (result.error) return { success: false, error: result.error.message };
  }
  if (movError) return { success: false, error: movError.message };

  return { success: true };
}

/**
 * Reverses the stock deduction from a cancelled order.
 * Mirrors deductStock() but adds quantities back to branch_stock.
 * Records a stock_movement of type 'anulacion' for each ingredient.
 */
export async function reverseStock(
  orderId: string,
  branchId: string,
  cancelledBy: string,
  reason: string,
  orderType: OrderType = "dine_in"
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: orderItems, error: orderError } = await supabase
    .from("order_items")
    .select(`
      qty, qty_physical, variant_id,
      product_variants(recipes(ingredient_id, quantity, apply_condition)),
      order_item_flavors(variant_id, proportion)
    `)
    .eq("order_id", orderId);

  if (orderError) return { success: false, error: orderError.message };
  if (!orderItems?.length) return { success: true };

  type Recipe = { ingredient_id: string; quantity: number; apply_condition: string };
  type FlavorRow = { variant_id: string; proportion: number };

  const additions: Record<string, number> = {};
  for (const item of orderItems) {
    const physicalQty = (item as { qty_physical?: number }).qty_physical ?? item.qty;
    const flavors = (item as unknown as { order_item_flavors: FlavorRow[] }).order_item_flavors ?? [];

    if (flavors.length > 0) {
      for (const flavor of flavors) {
        const { data: flavorVariant } = await supabase
          .from("product_variants")
          .select("recipes(ingredient_id, quantity, apply_condition)")
          .eq("id", flavor.variant_id)
          .single();
        const recipes: Recipe[] = (flavorVariant as unknown as { recipes: Recipe[] } | null)?.recipes ?? [];
        for (const recipe of recipes) {
          const condition = recipe.apply_condition ?? "always";
          if (condition !== "always" && condition !== orderType) continue;
          additions[recipe.ingredient_id] = (additions[recipe.ingredient_id] ?? 0) + recipe.quantity * physicalQty * flavor.proportion;
        }
      }
    } else {
      const recipes: Recipe[] = (item.product_variants as unknown as { recipes: Recipe[] })?.recipes ?? [];
      for (const recipe of recipes) {
        const condition = recipe.apply_condition ?? "always";
        if (condition !== "always" && condition !== orderType) continue;
        additions[recipe.ingredient_id] = (additions[recipe.ingredient_id] ?? 0) + recipe.quantity * physicalQty;
      }
    }
  }

  const ingredientIds = Object.keys(additions);
  if (!ingredientIds.length) return { success: true };

  const { data: stockRows, error: stockError } = await supabase
    .from("branch_stock")
    .select("id, ingredient_id, quantity")
    .eq("branch_id", branchId)
    .in("ingredient_id", ingredientIds);

  if (stockError) return { success: false, error: stockError.message };

  const updatePromises = (stockRows ?? []).map((stock) => {
    const amount = additions[stock.ingredient_id] ?? 0;
    return supabase
      .from("branch_stock")
      .update({ quantity: stock.quantity + amount })
      .eq("id", stock.id);
  });

  const movements = ingredientIds.map((ingredientId) => ({
    branch_id: branchId,
    ingredient_id: ingredientId,
    quantity: additions[ingredientId],
    type: "anulacion" as const,
    notes: `Anulación orden ${orderId}: ${reason}`,
    created_by: cancelledBy,
  }));

  const [updateResults, movError] = await Promise.all([
    Promise.all(updatePromises),
    supabase.from("stock_movements").insert(movements).then((r) => r.error),
  ]);

  for (const result of updateResults) {
    if (result.error) return { success: false, error: result.error.message };
  }
  if (movError) return { success: false, error: movError.message };

  return { success: true };
}
