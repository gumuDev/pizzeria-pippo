# TASK: Corrección de Stock en Promociones y Mejora de Reportes

## Contexto
Se identificaron dos problemas relacionados con las promociones:
1. **Bug crítico:** El stock se descuenta por unidades cobradas, no por unidades físicas vendidas
2. **Mejora:** El reporte de ventas no distingue entre precio bruto, descuentos y total cobrado

---

## BUG 1 — Stock no se descuenta correctamente en promociones

### Problema
Cuando se aplica una promoción tipo 2x1, el sistema descuenta el stock como si solo hubiera salido 1 producto de la cocina, cuando en realidad salieron 2 físicamente.

```
Situación actual (INCORRECTO):
  Venta: Pizza Mediana 2x1
  Stock descontado: 250g harina  ← como si saliera 1 pizza

Situación esperada (CORRECTO):
  Venta: Pizza Mediana 2x1
  Stock descontado: 500g harina  ← salieron 2 pizzas físicamente
```

### Regla general
> El stock siempre se descuenta por **unidades físicas que salen de la cocina**, nunca por unidades cobradas. La promoción afecta el precio, jamás el inventario.

### Comportamiento por tipo de promoción

**BUY_X_GET_Y (ej: 2x1, 4+1 gratis)**
```
2x1 Pizza Mediana:
  quantity_fisica:  2   ← descontar receta x2
  quantity_cobrada: 1   ← cobrar precio x1
  stock descuenta:  500g harina, 300g tomate, 360g queso

4+1 gratis:
  quantity_fisica:  5   ← descontar receta x5
  quantity_cobrada: 4   ← cobrar precio x4
```

**PERCENTAGE (descuento %)**
```
20% descuento Pizza Mediana:
  quantity_fisica:  1   ← igual, solo 1 pizza salió
  quantity_cobrada: 1
  precio cobrado:   Bs. 32  (Bs. 40 - 20%)
  stock descuenta:  receta x1 (sin cambio)
```

**COMBO (pizza + bebida precio especial)**
```
Combo: Pizza Personal + Coca Cola = Bs. 30
  quantity_fisica pizza:   1  → descontar receta pizza x1
  quantity_fisica bebida:  1  → descontar stock bebida x1
  precio cobrado:          Bs. 30 (precio combo, no suma de individuales)
```

### Corrección en el modelo de datos

Agregar campo `quantity_physical` en `order_items` separado de `quantity`:

```sql
ALTER TABLE order_items
  ADD COLUMN quantity_physical INTEGER NOT NULL DEFAULT 1;
```

```
order_items:
  quantity_physical  ← unidades físicas que salieron (para stock e inventario)
  quantity           ← unidades cobradas (para facturación)
  unit_price         ← precio unitario real
  discount_applied   ← monto descontado por promo
```

### Corrección en la lógica de descuento de stock

```typescript
// lib/recipes.ts

// INCORRECTO — usa quantity cobrada
async function deductStock(orderItems) {
  for (const item of orderItems) {
    const recipe = await getRecipe(item.variant_id)
    for (const ingredient of recipe) {
      await deductIngredient(
        ingredient.id,
        ingredient.quantity * item.quantity  // ← BUG: quantity cobrada
      )
    }
  }
}

// CORRECTO — usa quantity_physical
async function deductStock(orderItems) {
  for (const item of orderItems) {
    const recipe = await getRecipe(item.variant_id)
    for (const ingredient of recipe) {
      await deductIngredient(
        ingredient.id,
        ingredient.quantity * item.quantity_physical  // ← cantidad física real
      )
    }
  }
}
```

### Corrección en el motor de promociones

```typescript
// lib/promotions.ts

// Al aplicar BUY_X_GET_Y
function applyBuyXGetY(item, rule) {
  const setsOf = Math.floor(item.quantity_physical / rule.buy_qty)
  const freeUnits = setsOf * rule.get_qty

  return {
    quantity_physical: item.quantity_physical,        // todas salen de cocina
    quantity: item.quantity_physical - freeUnits,     // solo cobras las pagadas
    discount_applied: freeUnits * item.unit_price     // valor de las unidades gratis
  }
}
```

---

## MEJORA 2 — Reporte de ventas con desglose de promociones

### Problema
El reporte actual muestra solo el total cobrado. No permite ver cuántas unidades físicas salieron, ni cuánto se descontó por promociones.

### Reporte esperado

```
Ventas del día — Sucursal A — Domingo 15/01/2025

Producto               Unid. físicas   Precio bruto   Descuento    Cobrado
──────────────────────────────────────────────────────────────────────────
Pizza Mediana (2x1)         4            Bs. 160        Bs. 80      Bs. 80
Pizza Familiar              2            Bs. 120          —         Bs. 120
Coca Cola                   3            Bs. 24           —         Bs. 24
──────────────────────────────────────────────────────────────────────────
TOTAL                       9            Bs. 304        Bs. 80      Bs. 224
```

- **Unid. físicas** → cuántos productos salieron de la cocina (afecta stock)
- **Precio bruto** → lo que costaría sin promos (quantity_physical × unit_price)
- **Descuento** → lo que se descontó por promociones
- **Cobrado** → lo que realmente entró a caja

### Sección adicional — Resumen de promociones del día

```
Promociones aplicadas hoy:

  2x1 Pizza Mediana     → 2 veces aplicada  →  Bs. 80 descontados
  ─────────────────────────────────────────────────────────────────
  Total descuentos del día                     Bs. 80
```

Esto permite al admin evaluar si una promoción está siendo rentable o no.

### Query para el reporte

```typescript
const { data } = await supabase
  .from('order_items')
  .select(`
    quantity,
    quantity_physical,
    unit_price,
    discount_applied,
    product_variants (
      name,
      products ( name )
    ),
    orders!inner (
      branch_id,
      created_at
    )
  `)
  .eq('orders.branch_id', branchId)
  .gte('orders.created_at', `${date}T00:00:00`)
  .lte('orders.created_at', `${date}T23:59:59`)
```

---

## Criterios de Aceptación

### Bug de stock
- [x] Campo `qty_physical` agregado en `order_items` (nombre corto consistente con `qty`)
- [x] El descuento de stock usa `qty_physical` en todos los casos (`lib/recipes.ts`)
- [x] 2x1: se descuenta receta x2 del stock aunque solo se cobre x1
- [x] 4+1: se descuenta receta x5 del stock aunque solo se cobre x4
- [x] PERCENTAGE: el stock no cambia respecto a la cantidad física vendida
- [x] COMBO: se descuenta la receta de cada producto del combo individualmente

### Lógica implementada

El cajero agrega **unidades a cobrar** al carrito. El motor de promociones calcula:
- `qty` = unidades pagadas por el cliente (lo que entra a caja)
- `qty_physical` = `qty` + unidades gratis = lo que sale físicamente de la cocina

```
Cajero agrega 1 pizza con 2x1 activa:
  qty          = 1  → se cobra 1
  qty_physical = 2  → salen 2 de la cocina
  discount     = precio × 1

Cajero agrega 4 pizzas con 4+1 activa:
  qty          = 4  → se cobran 4
  qty_physical = 5  → salen 5 de la cocina
  discount     = precio × 1
```

### Archivos modificados
- `src/lib/promotions.ts` — `DiscountedItem.qty_physical`, lógica en `applyBuyXGetY` y `getCartTotal`
- `src/lib/recipes.ts` — usa `qty_physical` para multiplicar receta
- `src/app/api/orders/route.ts` — guarda `qty_physical` en `order_items`
- `src/app/(pos)/pos/page.tsx` — muestra `qty_physical` en carrito, modales y ticket
- `src/app/display/page.tsx` — muestra `qty_physical` en pantalla cliente

### Migración SQL requerida
```sql
ALTER TABLE order_items
  ADD COLUMN qty_physical INTEGER NOT NULL DEFAULT 1;
```

### Mejora de reportes
- [ ] Reporte muestra columnas: unidades físicas, precio bruto, descuento y cobrado
- [ ] Sección de resumen de promociones aplicadas en el día con monto total descontado
- [ ] El total cobrado en el reporte coincide exactamente con el dinero que debería haber en caja

## Estado: ✅ Bug corregido — Mejora de reportes pendiente