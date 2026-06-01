import { createClient } from "@supabase/supabase-js";
import { buildStockAlertMessage, sendTelegramAlert, type StockAlert } from "@/lib/notifications";

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
      product_variants(recipes(ingredient_id, quantity, apply_condition), products(track_stock)),
      order_item_flavors(variant_id, proportion)
    `)
    .eq("order_id", orderId);

  if (orderError) return { success: false, error: orderError.message };
  if (!orderItems?.length) return { success: true };

  type Recipe = { ingredient_id: string; quantity: number; apply_condition: string };
  type FlavorRow = { variant_id: string; proportion: number };

  // 2. Aggregate deductions — ingredients (recipe-based) and resale products (unit-based)
  const deductions: Record<string, number> = {};
  const resaleDeductions: Record<string, number> = {}; // variant_id → units

  for (const item of orderItems) {
    const variant = item.product_variants as unknown as { recipes: Recipe[]; products: { track_stock: boolean } | null } | null;
    const trackStock = variant?.products?.track_stock ?? true;
    if (!trackStock) continue;

    const physicalQty = (item as { qty_physical?: number }).qty_physical ?? item.qty;
    const recipes: Recipe[] = variant?.recipes ?? [];
    const flavors = (item as unknown as { order_item_flavors: FlavorRow[] }).order_item_flavors ?? [];

    if (flavors.length > 0) {
      // Mixed pizza: fetch each flavor's recipe and apply proportion
      for (const flavor of flavors) {
        const { data: flavorVariant } = await supabase
          .from("product_variants")
          .select("recipes(ingredient_id, quantity, apply_condition)")
          .eq("id", flavor.variant_id)
          .single();
        const flavorRecipes: Recipe[] = (flavorVariant as unknown as { recipes: Recipe[] } | null)?.recipes ?? [];
        for (const recipe of flavorRecipes) {
          const condition = recipe.apply_condition ?? "always";
          if (condition !== "always" && condition !== orderType) continue;
          deductions[recipe.ingredient_id] = (deductions[recipe.ingredient_id] ?? 0) + recipe.quantity * physicalQty * flavor.proportion;
        }
      }
    } else if (recipes.length > 0) {
      // Product with recipe: deduct ingredients
      for (const recipe of recipes) {
        const condition = recipe.apply_condition ?? "always";
        if (condition !== "always" && condition !== orderType) continue;
        deductions[recipe.ingredient_id] = (deductions[recipe.ingredient_id] ?? 0) + recipe.quantity * physicalQty;
      }
    } else {
      // Resale product (no recipe, track_stock=true): deduct units from branch_product_stock
      resaleDeductions[item.variant_id] = (resaleDeductions[item.variant_id] ?? 0) + physicalQty;
    }
  }

  // 3a. Deduct resale products from branch_product_stock
  const resaleVariantIds = Object.keys(resaleDeductions);
  if (resaleVariantIds.length > 0) {
    const { data: resaleStockRows } = await supabase
      .from("branch_product_stock")
      .select("id, variant_id, quantity")
      .eq("branch_id", branchId)
      .in("variant_id", resaleVariantIds);

    const resaleUpdatePromises = (resaleStockRows ?? []).map((row) => {
      const amount = resaleDeductions[row.variant_id] ?? 0;
      return supabase
        .from("branch_product_stock")
        .update({ quantity: Math.max(0, row.quantity - amount), updated_at: new Date().toISOString() })
        .eq("id", row.id);
    });

    const resaleMovements = resaleVariantIds.map((variantId) => ({
      branch_id: branchId,
      variant_id: variantId,
      quantity: -resaleDeductions[variantId],
      type: "venta" as const,
      notes: `Orden ${orderId}`,
      created_by: userId,
    }));

    await Promise.all([
      ...resaleUpdatePromises,
      supabase.from("product_stock_movements").insert(resaleMovements),
    ]);
  }

  const ingredientIds = Object.keys(deductions);
  if (!ingredientIds.length && !resaleVariantIds.length) return { success: true };
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

  // 5. Check for low-stock alerts and notify via Telegram (fire-and-forget)
  (async () => {
    try {
      const allAlerts: StockAlert[] = [];

      if (ingredientIds.length > 0) {
        const { data: alertRows } = await supabase
          .from("branch_stock")
          .select("ingredient_id, quantity, min_quantity, ingredients(name, unit), branches(name)")
          .eq("branch_id", branchId)
          .in("ingredient_id", ingredientIds);

        for (const row of alertRows ?? []) {
          if (row.quantity < row.min_quantity) {
            const ingredient = row.ingredients as unknown as { name: string; unit: string } | null;
            const branch = row.branches as unknown as { name: string } | null;
            allAlerts.push({
              ingredientName: ingredient?.name ?? row.ingredient_id,
              currentQty: row.quantity,
              minQty: row.min_quantity,
              unit: ingredient?.unit ?? "",
              branchName: branch?.name ?? branchId,
            });
          }
        }
      }

      if (resaleVariantIds.length > 0) {
        const { data: resaleAlertRows } = await supabase
          .from("branch_product_stock")
          .select("variant_id, quantity, min_quantity, product_variants(name, products(name)), branches(name)")
          .eq("branch_id", branchId)
          .in("variant_id", resaleVariantIds);

        for (const row of resaleAlertRows ?? []) {
          if (row.min_quantity != null && row.quantity < row.min_quantity) {
            const pv = row.product_variants as unknown as { name: string; products: { name: string } | null } | null;
            const branch = row.branches as unknown as { name: string } | null;
            const productName = pv?.products?.name ?? "";
            const variantName = pv?.name && pv.name !== "Unidad" ? ` — ${pv.name}` : "";
            allAlerts.push({
              ingredientName: `${productName}${variantName}`,
              currentQty: row.quantity,
              minQty: row.min_quantity,
              unit: "u",
              branchName: branch?.name ?? branchId,
            });
          }
        }
      }

      if (allAlerts.length > 0) {
        buildStockAlertMessage(allAlerts).then((message) => sendTelegramAlert(message)).catch(console.error);
      }
    } catch (err) {
      console.error("[recipes] stock alert check error:", err);
    }
  })();

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
      product_variants(recipes(ingredient_id, quantity, apply_condition), products(track_stock)),
      order_item_flavors(variant_id, proportion)
    `)
    .eq("order_id", orderId);

  if (orderError) return { success: false, error: orderError.message };
  if (!orderItems?.length) return { success: true };

  type Recipe = { ingredient_id: string; quantity: number; apply_condition: string };
  type FlavorRow = { variant_id: string; proportion: number };

  const additions: Record<string, number> = {};
  const resaleAdditions: Record<string, number> = {};

  for (const item of orderItems) {
    const variant = item.product_variants as unknown as { recipes: Recipe[]; products: { track_stock: boolean } | null } | null;
    const trackStock = variant?.products?.track_stock ?? true;
    if (!trackStock) continue;

    const physicalQty = (item as { qty_physical?: number }).qty_physical ?? item.qty;
    const recipes: Recipe[] = variant?.recipes ?? [];
    const flavors = (item as unknown as { order_item_flavors: FlavorRow[] }).order_item_flavors ?? [];

    if (flavors.length > 0) {
      for (const flavor of flavors) {
        const { data: flavorVariant } = await supabase
          .from("product_variants")
          .select("recipes(ingredient_id, quantity, apply_condition)")
          .eq("id", flavor.variant_id)
          .single();
        const flavorRecipes: Recipe[] = (flavorVariant as unknown as { recipes: Recipe[] } | null)?.recipes ?? [];
        for (const recipe of flavorRecipes) {
          const condition = recipe.apply_condition ?? "always";
          if (condition !== "always" && condition !== orderType) continue;
          additions[recipe.ingredient_id] = (additions[recipe.ingredient_id] ?? 0) + recipe.quantity * physicalQty * flavor.proportion;
        }
      }
    } else if (recipes.length > 0) {
      for (const recipe of recipes) {
        const condition = recipe.apply_condition ?? "always";
        if (condition !== "always" && condition !== orderType) continue;
        additions[recipe.ingredient_id] = (additions[recipe.ingredient_id] ?? 0) + recipe.quantity * physicalQty;
      }
    } else {
      resaleAdditions[item.variant_id] = (resaleAdditions[item.variant_id] ?? 0) + physicalQty;
    }
  }

  // Restore resale product stock
  const resaleVariantIds = Object.keys(resaleAdditions);
  if (resaleVariantIds.length > 0) {
    const { data: resaleStockRows } = await supabase
      .from("branch_product_stock")
      .select("id, variant_id, quantity")
      .eq("branch_id", branchId)
      .in("variant_id", resaleVariantIds);

    const resaleUpdatePromises = (resaleStockRows ?? []).map((row) => {
      const amount = resaleAdditions[row.variant_id] ?? 0;
      return supabase
        .from("branch_product_stock")
        .update({ quantity: row.quantity + amount, updated_at: new Date().toISOString() })
        .eq("id", row.id);
    });

    const resaleMovements = resaleVariantIds.map((variantId) => ({
      branch_id: branchId,
      variant_id: variantId,
      quantity: resaleAdditions[variantId],
      type: "anulacion" as const,
      notes: `Anulación orden ${orderId}: ${reason}`,
      created_by: cancelledBy,
    }));

    await Promise.all([
      ...resaleUpdatePromises,
      supabase.from("product_stock_movements").insert(resaleMovements),
    ]);
  }

  const ingredientIds = Object.keys(additions);
  if (!ingredientIds.length && !resaleVariantIds.length) return { success: true };
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
