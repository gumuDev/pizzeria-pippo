# Debug: Combo no se aplica en el POS

## Contexto

Archivo principal: `src/lib/promotions.ts` — función `applyCombo()`  
Archivo secundario: `src/app/(pos)/pos/page.tsx` — hook `useEffect` que llama a `applyPromotions()`

El problema reportado: el cajero agrega los dos productos del combo al carrito y el descuento no se aplica.

---

## Bug 1 — `combo_price` null detiene la ejecución silenciosamente

**Ubicación:** `promotions.ts` → `applyCombo()`, línea:
```ts
const comboPrice = promo.promotion_rules[0]?.combo_price;
if (comboPrice == null) return;
```

**Causa:** Si al crear la promoción no se ingresó el precio especial en "Regla 1" del formulario, `combo_price` llega como `null` desde la base de datos. La función retorna sin error, sin log, sin aplicar nada.

**Fix:** Agregar validación explícita antes de guardar en el admin, y un log de advertencia aquí:
```ts
if (comboPrice == null) {
  console.warn(`[Combo] "${promo.name}" no tiene combo_price definido en regla 0`);
  return;
}
```

---

## Bug 2 — `originalTotal` ignora `qty` del ítem

**Ubicación:** `promotions.ts` → `applyCombo()`, línea:
```ts
const originalTotal = comboItems.reduce((sum, i) => sum + i.unit_price, 0);
```

**Causa:** No multiplica por `i.qty`. Si un producto del combo tiene qty > 1, el total original está subestimado y la distribución proporcional del descuento es incorrecta.

**Fix:**
```ts
const originalTotal = comboItems.reduce((sum, i) => sum + i.unit_price * i.qty, 0);
```

Y ajustar la distribución del descuento de forma consistente:
```ts
const discount = totalDiscount * share; // share ya usa unit_price * qty si se corrige arriba
```

---

## Bug 3 — `applyPromotions` en el POS recibe promociones sin filtrar por día

**Ubicación:** `pos/page.tsx`:
```ts
const result = applyPromotions(cart, promotions);
```

**Causa:** `promotions` viene del API (`/api/promotions?branchId=...&date=...`). Si el API no filtra por `days_of_week`, una promo configurada solo para domingos se aplicaría cualquier día de la semana.

La función `getActivePromotions()` ya existe en `promotions.ts` y hace ese filtro correctamente, pero **no se está usando en el POS**.

**Fix:** Filtrar antes de aplicar:
```ts
useEffect(() => {
  if (cart.length === 0) {
    setDiscountedCart([]);
    return;
  }
  const active = getActivePromotions(promotions, identity?.branch_id ?? "");
  const result = applyPromotions(cart, active);
  setDiscountedCart(result);
}, [cart, promotions, identity]);
```

---

## Checklist para verificar

- [ ] Al crear el combo, ¿se llenó el campo "Precio especial del combo (Bs)" en la Regla 1?
- [ ] Verificar en Supabase: `select combo_price from promotion_rules where ...` — debe ser un número, no null
- [ ] Agregar `console.log(promotions)` en el POS antes de `applyPromotions` para confirmar que la promo llega con sus reglas completas (`promotion_rules` con `combo_price`)
- [ ] Confirmar que el API en `GET /api/promotions` incluye `promotion_rules` en el join/select
- [ ] Aplicar Bug 2 y Bug 3 aunque no sean la causa principal, son incorrecciones reales