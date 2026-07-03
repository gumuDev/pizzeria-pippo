import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface WarehouseStockRow {
  id: string;
  ingredient_id: string;
  quantity: number;
  min_quantity: number;
  updated_at: string;
  ingredients: { name: string; unit: string };
}

export interface WarehouseMovementRow {
  id: string;
  ingredient_id: string;
  quantity: number;
  type: "compra" | "transferencia" | "ajuste";
  branch_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  ingredients: { name: string; unit: string };
  branches: { name: string } | null;
}

export interface GetMovementsFilters {
  type?: "compra" | "transferencia" | "ajuste";
  ingredient_id?: string;
  branch_id?: string;
  date_from?: string;
  date_to?: string;
}

// ── Purchase ──────────────────────────────────────────────────────────────────

export async function registerPurchase(
  supabase: SupabaseClient,
  ingredientId: string,
  quantity: number,
  notes: string | null,
  userId: string | null,
  minQuantity?: number
): Promise<{ error: string | null }> {
  if (quantity <= 0) {
    return { error: "La cantidad debe ser mayor a 0" };
  }

  // Upsert warehouse_stock
  const { data: existing, error: fetchErr } = await supabase
    .from("warehouse_stock")
    .select("id, quantity")
    .eq("ingredient_id", ingredientId)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };

  if (existing) {
    const updates: Record<string, unknown> = {
      quantity: existing.quantity + quantity,
      updated_at: new Date().toISOString(),
    };
    if (minQuantity != null) updates.min_quantity = minQuantity;
    const { error } = await supabase.from("warehouse_stock").update(updates).eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("warehouse_stock")
      .insert({ ingredient_id: ingredientId, quantity, min_quantity: minQuantity ?? 0 });
    if (error) return { error: error.message };
  }

  // Record movement
  const { error: movErr } = await supabase.from("warehouse_movements").insert({
    ingredient_id: ingredientId,
    quantity,
    type: "compra",
    branch_id: null,
    notes: notes ?? null,
    created_by: userId,
  });
  if (movErr) return { error: movErr.message };

  return { error: null };
}

// ── Transfer ──────────────────────────────────────────────────────────────────

export async function transferToBranch(
  supabase: SupabaseClient,
  ingredientId: string,
  quantity: number,
  branchId: string,
  notes: string | null,
  userId: string | null
): Promise<{ error: string | null; available?: number }> {
  if (quantity <= 0) {
    return { error: "La cantidad debe ser mayor a 0" };
  }

  // Check warehouse stock
  const { data: warehouseRow, error: fetchErr } = await supabase
    .from("warehouse_stock")
    .select("id, quantity")
    .eq("ingredient_id", ingredientId)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };
  if (!warehouseRow) return { error: "Insumo no encontrado en bodega" };

  if (warehouseRow.quantity < quantity) {
    return {
      error: `Stock insuficiente en bodega. Disponible: ${warehouseRow.quantity}`,
      available: warehouseRow.quantity,
    };
  }

  // Deduct from warehouse
  const { error: warehouseErr } = await supabase
    .from("warehouse_stock")
    .update({
      quantity: warehouseRow.quantity - quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", warehouseRow.id);
  if (warehouseErr) return { error: warehouseErr.message };

  // Add to branch_stock
  const { data: branchRow } = await supabase
    .from("branch_stock")
    .select("id, quantity")
    .eq("branch_id", branchId)
    .eq("ingredient_id", ingredientId)
    .single();

  if (branchRow) {
    const { error } = await supabase
      .from("branch_stock")
      .update({ quantity: branchRow.quantity + quantity, updated_at: new Date().toISOString() })
      .eq("id", branchRow.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("branch_stock")
      .insert({ branch_id: branchId, ingredient_id: ingredientId, quantity, min_quantity: 0 });
    if (error) return { error: error.message };
  }

  // Record in warehouse_movements
  const { error: wmErr } = await supabase.from("warehouse_movements").insert({
    ingredient_id: ingredientId,
    quantity: -quantity,
    type: "transferencia",
    branch_id: branchId,
    notes: notes ?? null,
    created_by: userId,
  });
  if (wmErr) return { error: wmErr.message };

  // Record in stock_movements (branch side)
  const { error: smErr } = await supabase.from("stock_movements").insert({
    branch_id: branchId,
    ingredient_id: ingredientId,
    quantity,
    type: "compra",
    origin: "transferencia",
    notes: notes ?? null,
    created_by: userId,
  });
  if (smErr) return { error: smErr.message };

  return { error: null };
}

// ── Adjust ────────────────────────────────────────────────────────────────────

export async function adjustWarehouseStock(
  supabase: SupabaseClient,
  ingredientId: string,
  realQuantity: number,
  notes: string | null,
  userId: string | null
): Promise<{ error: string | null; difference?: number }> {
  if (realQuantity < 0) {
    return { error: "La cantidad no puede ser negativa" };
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("warehouse_stock")
    .select("id, quantity")
    .eq("ingredient_id", ingredientId)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };
  if (!existing) return { error: "Insumo no encontrado en bodega" };

  const difference = realQuantity - existing.quantity;

  const { error: updateErr } = await supabase
    .from("warehouse_stock")
    .update({ quantity: realQuantity, updated_at: new Date().toISOString() })
    .eq("id", existing.id);
  if (updateErr) return { error: updateErr.message };

  const { error: movErr } = await supabase.from("warehouse_movements").insert({
    ingredient_id: ingredientId,
    quantity: difference,
    type: "ajuste",
    branch_id: null,
    notes: notes ?? null,
    created_by: userId,
  });
  if (movErr) return { error: movErr.message };

  return { error: null, difference };
}

// ── Read helpers ──────────────────────────────────────────────────────────────

export async function getWarehouseStock(
  supabase: SupabaseClient,
  page = 1,
  pageSize = 10,
  filters: { ingredientId?: string; status?: "low" | "ok" } = {}
): Promise<{ data: WarehouseStockRow[] | null; total: number; error: string | null }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("warehouse_stock")
    .select("*, ingredients(name, unit)", { count: "exact" })
    .order("ingredients(name)")
    .range(from, to);

  if (filters.ingredientId) query = query.eq("ingredient_id", filters.ingredientId);

  const { data, error, count } = await query;
  if (error) return { data: null, total: 0, error: error.message };

  let result = data as WarehouseStockRow[];
  if (filters.status === "low") result = result.filter((r) => r.quantity < r.min_quantity);
  if (filters.status === "ok") result = result.filter((r) => r.quantity >= r.min_quantity);

  return { data: result, total: count ?? 0, error: null };
}

export async function getWarehouseMovements(
  supabase: SupabaseClient,
  filters: GetMovementsFilters = {}
): Promise<{ data: WarehouseMovementRow[] | null; error: string | null }> {
  let query = supabase
    .from("warehouse_movements")
    .select("*, ingredients(name, unit), branches(name)")
    .order("created_at", { ascending: false });

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.ingredient_id) query = query.eq("ingredient_id", filters.ingredient_id);
  if (filters.branch_id) query = query.eq("branch_id", filters.branch_id);
  if (filters.date_from) query = query.gte("created_at", filters.date_from);
  if (filters.date_to) query = query.lte("created_at", filters.date_to);

  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: data as WarehouseMovementRow[], error: null };
}

// ── Auth helper (reused from other routes pattern) ────────────────────────────

export function createAuthClient(token: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}
