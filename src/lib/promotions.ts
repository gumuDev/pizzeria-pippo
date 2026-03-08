/**
 * Promotion engine — used by the POS to calculate discounts automatically.
 * No UI dependencies, pure logic.
 */
import { nowInBolivia } from "@/lib/timezone";

export interface CartItem {
  variant_id: string;
  qty: number;
  unit_price: number;
  product_name: string;
  variant_name: string;
  category: string;
}

export interface PromotionRule {
  id: string;
  variant_id: string | null;
  buy_qty: number | null;
  get_qty: number | null;
  discount_percent: number | null;
  combo_price: number | null;
}

export interface Promotion {
  id: string;
  name: string;
  type: "BUY_X_GET_Y" | "PERCENTAGE" | "COMBO";
  days_of_week: number[];
  start_date: string;
  end_date: string;
  branch_id: string | null;
  active: boolean;
  promotion_rules: PromotionRule[];
}

export interface DiscountedItem extends CartItem {
  qty_physical: number;   // units physically prepared (affects stock)
  discount_applied: number;
  final_price: number;
  promo_label: string | null;
}

/**
 * Returns promotions that are active for a given branch and date.
 */
export function getActivePromotions(
  promotions: Promotion[],
  branchId: string,
  date: Date = nowInBolivia()
): Promotion[] {
  const dayOfWeek = date.getDay();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`;

  return promotions.filter((p) => {
    if (!p.active) return false;
    if (p.branch_id && p.branch_id !== branchId) return false;
    if (dateStr < p.start_date || dateStr > p.end_date) return false;
    if (p.days_of_week.length > 0 && !p.days_of_week.includes(dayOfWeek)) return false;
    return true;
  });
}

/**
 * Applies active promotions to cart items.
 * Each item gets at most one promo (best discount wins, no stacking).
 */
export function applyPromotions(
  cartItems: CartItem[],
  activePromotions: Promotion[]
): DiscountedItem[] {
  const result: DiscountedItem[] = cartItems.map((item) => ({
    ...item,
    qty_physical: item.qty,   // default: all units are physical (no free units)
    discount_applied: 0,
    final_price: item.unit_price,
    promo_label: null,
  }));

  for (const promo of activePromotions) {
    if (promo.type === "BUY_X_GET_Y") {
      applyBuyXGetY(result, promo);
    } else if (promo.type === "PERCENTAGE") {
      applyPercentage(result, promo);
    } else if (promo.type === "COMBO") {
      applyCombo(result, promo);
    }
  }

  return result;
}

function applyBuyXGetY(items: DiscountedItem[], promo: Promotion) {
  for (const rule of promo.promotion_rules) {
    if (!rule.variant_id || !rule.buy_qty || !rule.get_qty) continue;

    const item = items.find((i) => i.variant_id === rule.variant_id);
    if (!item) continue;

    // qty = units the customer pays for (what the cashier enters)
    // For every buy_qty paid, get_qty come out of the kitchen for free
    // qty_physical = qty + freeUnits (all units that leave the kitchen)
    const paid = item.qty;
    const sets = Math.floor(paid / rule.buy_qty);
    const freeUnits = sets * rule.get_qty;

    if (freeUnits <= 0) continue;

    const discount = freeUnits * item.unit_price;
    if (discount > item.discount_applied) {
      item.qty_physical = paid + freeUnits;   // total units leaving the kitchen
      item.discount_applied = discount;
      item.final_price = item.unit_price;
      item.promo_label = `${rule.buy_qty + rule.get_qty}x${rule.buy_qty} — ${promo.name}`;
    }
  }
}

function applyPercentage(items: DiscountedItem[], promo: Promotion) {
  for (const rule of promo.promotion_rules) {
    if (!rule.discount_percent) continue;

    const targets = rule.variant_id
      ? items.filter((i) => i.variant_id === rule.variant_id)
      : items; // no variant_id = applies to all items in cart

    for (const item of targets) {
      const discount = (item.unit_price * item.qty * rule.discount_percent) / 100;
      if (discount > item.discount_applied) {
        item.discount_applied = discount;
        item.final_price = item.unit_price * (1 - rule.discount_percent / 100);
        item.promo_label = `${rule.discount_percent}% OFF — ${promo.name}`;
      }
    }
  }
}

function applyCombo(items: DiscountedItem[], promo: Promotion) {
  // Check if all required variants are present in the cart
  const requiredVariants = promo.promotion_rules
    .filter((r) => r.variant_id)
    .map((r) => r.variant_id!);

  const allPresent = requiredVariants.every((vId) =>
    items.some((i) => i.variant_id === vId && i.qty > 0)
  );

  if (!allPresent) return;

  const comboPrice = promo.promotion_rules[0]?.combo_price;
  if (comboPrice == null) {
    console.warn(`[Combo] "${promo.name}" no tiene combo_price definido en regla 0`);
    return;
  }

  // Calculate total original price of combo items
  const comboItems = items.filter((i) => requiredVariants.includes(i.variant_id));
  const originalTotal = comboItems.reduce((sum, i) => sum + i.unit_price * i.qty, 0);
  const totalDiscount = originalTotal - comboPrice;

  if (totalDiscount <= 0) return;

  // Distribute discount proportionally across combo items
  for (const item of comboItems) {
    const share = item.unit_price / originalTotal;
    const discount = totalDiscount * share;
    if (discount > item.discount_applied) {
      item.discount_applied = discount;
      item.final_price = item.unit_price - discount;
      item.promo_label = `Combo — ${promo.name}`;
    }
  }
}

/**
 * Returns total discount amount for the cart.
 */
export function getTotalDiscount(items: DiscountedItem[]): number {
  return items.reduce((sum, i) => sum + i.discount_applied, 0);
}

/**
 * Returns cart total after discounts.
 */
export function getCartTotal(items: DiscountedItem[]): number {
  return items.reduce((sum, i) => sum + i.unit_price * i.qty_physical - i.discount_applied, 0);
}
