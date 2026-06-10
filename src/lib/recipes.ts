import { createClient } from "@supabase/supabase-js";
import { buildStockAlertMessage, sendTelegramAlert, type StockAlert } from "@/lib/notifications";

type OrderType = "dine_in" | "takeaway";

/**
 * Checks branch stock after a sale and sends a Telegram alert for any
 * ingredient below its minimum. Fire-and-forget: never blocks the caller.
 * (Stock deduction itself happens inside the create_order_atomic RPC.)
 */
export function notifyLowStock(branchId: string, ingredientIds: string[]): void {
  if (!ingredientIds.length) return;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  (async () => {
    try {
      const { data: alertRows } = await supabase
        .from("branch_stock")
        .select("ingredient_id, quantity, min_quantity, ingredients(name, unit), branches(name)")
        .eq("branch_id", branchId)
        .in("ingredient_id", ingredientIds);

      const alerts: StockAlert[] = (alertRows ?? [])
        .filter((row) => row.quantity < row.min_quantity)
        .map((row) => {
          const ingredient = row.ingredients as unknown as { name: string; unit: string } | null;
          const branch = row.branches as unknown as { name: string } | null;
          return {
            ingredientName: ingredient?.name ?? row.ingredient_id,
            currentQty: row.quantity,
            minQty: row.min_quantity,
            unit: ingredient?.unit ?? "",
            branchName: branch?.name ?? branchId,
          };
        });

      if (alerts.length > 0) {
        const message = await buildStockAlertMessage(alerts);
        sendTelegramAlert(message).catch(console.error);
      }
    } catch (err) {
      console.error("[recipes] stock alert check error:", err);
    }
  })();
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
