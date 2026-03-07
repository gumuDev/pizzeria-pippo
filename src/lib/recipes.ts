import { createClient } from "@supabase/supabase-js";

/**
 * Deducts ingredients from branch_stock based on the recipes of each order item.
 * Records a stock_movement of type 'venta' for each deduction.
 * Called server-side after an order is confirmed.
 */
export async function deductStock(
  orderId: string,
  branchId: string,
  token: string,
  userId: string | null = null
): Promise<{ success: boolean; error?: string }> {
  // Use service role to bypass RLS for stock updates — deduction is always server-side after auth check
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch order items with their variant recipes
  // qty_physical = units actually prepared (used for stock deduction)
  // qty          = units charged (may be less when BUY_X_GET_Y promo applies)
  const { data: orderItems, error: orderError } = await supabase
    .from("order_items")
    .select("qty, qty_physical, variant_id, product_variants(recipes(ingredient_id, quantity))")
    .eq("order_id", orderId);

  if (orderError) return { success: false, error: orderError.message };
  if (!orderItems?.length) return { success: true };

  // 2. Aggregate total deduction per ingredient using qty_physical
  const deductions: Record<string, number> = {};
  for (const item of orderItems) {
    const recipes = (item.product_variants as { recipes: { ingredient_id: string; quantity: number }[] })?.recipes ?? [];
    const physicalQty = (item as { qty_physical?: number }).qty_physical ?? item.qty;
    for (const recipe of recipes) {
      deductions[recipe.ingredient_id] = (deductions[recipe.ingredient_id] ?? 0) + recipe.quantity * physicalQty;
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
      .update({ quantity: Math.max(0, stock.quantity - amount) })
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
