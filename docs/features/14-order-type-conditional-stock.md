# 14 — Tipo de Pedido y Descuento Condicional de Insumos

## Objetivo

Al confirmar una venta en el POS, el cajero selecciona si el pedido es "Comer aquí" o "Para llevar". El sistema descuenta del inventario solo los insumos que aplican según ese tipo de pedido, según la condición definida en cada receta.

---

## Cambios en la Base de Datos

### Migración: `011_order_type_and_recipe_condition.sql`

```sql
-- 1. Agregar tipo de pedido a orders
ALTER TABLE public.orders
  ADD COLUMN order_type text CHECK (order_type = ANY (ARRAY['dine_in'::text, 'takeaway'::text]))
  NOT NULL DEFAULT 'dine_in';

-- 2. Agregar condición de aplicación a recipes
ALTER TABLE public.recipes
  ADD COLUMN apply_condition text CHECK (apply_condition = ANY (
    ARRAY['always'::text, 'takeaway'::text, 'dine_in'::text]
  )) NOT NULL DEFAULT 'always';

-- Las recetas existentes quedan como 'always' automáticamente (sin cambio de comportamiento)
```

### Lógica de descuento

```
apply_condition = 'always'   → se descuenta siempre (ingredientes base del producto)
apply_condition = 'takeaway' → se descuenta solo si order_type = 'takeaway'
apply_condition = 'dine_in'  → se descuenta solo si order_type = 'dine_in'
```

**Ejemplo — Pizza Pepperoni Mediana:**

| Insumo | apply_condition | Comer aquí | Para llevar |
|--------|----------------|------------|-------------|
| Harina | always | ✅ | ✅ |
| Queso | always | ✅ | ✅ |
| Salsa de tomate | always | ✅ | ✅ |
| Pepperoni | always | ✅ | ✅ |
| Plato descartable | dine_in | ✅ | ❌ |
| Cubiertos | dine_in | ✅ | ❌ |
| Caja de cartón | takeaway | ❌ | ✅ |
| Orégano en sobre | takeaway | ❌ | ✅ |

---

## Cambios por módulo

### 1. Panel Admin — Registro de Recetas (Productos, paso 3)

Al agregar un insumo a la receta de una variante, mostrar un selector de condición:

```
Insumo: [ Harina          ▼ ]   Cantidad: [ 250 ] g   Condición: [ Siempre       ▼ ]
Insumo: [ Caja de cartón  ▼ ]   Cantidad: [   1 ] unidad  Condición: [ Solo para llevar ▼ ]
Insumo: [ Plato           ▼ ]   Cantidad: [   1 ] unidad  Condición: [ Solo para comer aquí ▼ ]
```

Opciones del selector:
- **Siempre** (`always`) — default
- **Solo para llevar** (`takeaway`)
- **Solo para comer aquí** (`dine_in`)

Tooltip: _"Define cuándo se descuenta este insumo del inventario"_

### 2. POS — Selector de tipo de pedido

**Flujo actual:**
```
Cajero arma pedido → "Confirmar venta" → venta registrada
```

**Flujo nuevo:**
```
Cajero arma pedido → "Confirmar venta"
  → aparece selector de tipo de pedido (obligatorio):

  ┌──────────────────────────────────┐
  │  ¿Cómo va el pedido?             │
  │                                  │
  │  [ 🍽️ Comer aquí ]  [ 🥡 Para llevar ] │
  └──────────────────────────────────┘

  → cajero selecciona una opción
  → venta se registra con order_type
  → sistema descuenta solo los insumos que aplican
```

- Selección obligatoria — no hay opción "sin especificar"
- Default visual: ninguno seleccionado (fuerza elección consciente)
- Este selector se combina con el selector de método de pago (módulo 13) en el mismo modal de confirmación

### Modal de confirmación unificado

```
┌──────────────────────────────────────┐
│  Confirmar venta                     │
│                                      │
│  ¿Cómo va el pedido?                 │
│  [ 🍽️ Comer aquí ]  [ 🥡 Para llevar ] │
│                                      │
│  ¿Cómo pagó el cliente?              │
│  [ 💵 Efectivo ]  [ 📱 QR ]          │
│  [ Sin especificar ]                 │
│                                      │
│  [ Confirmar ]  (deshabilitado hasta │
│   seleccionar tipo de pedido)        │
└──────────────────────────────────────┘
```

### 3. Lógica de descuento en `src/lib/recipes.ts`

La función `deductStock` recibe `orderType` y filtra los insumos de la receta antes de descontar:

```typescript
// Pseudocódigo
const applicableIngredients = recipeItems.filter(item =>
  item.apply_condition === 'always' ||
  item.apply_condition === orderType  // 'dine_in' | 'takeaway'
);
// Solo descuenta applicableIngredients del stock de la sucursal
```

### 4. API Route — `POST /api/orders`

- Recibe `order_type: 'dine_in' | 'takeaway'` en el body
- Pasa `order_type` a `deductStock`
- Guarda `order_type` en la tabla `orders`

### 5. Display del Cliente

Mostrar el tipo de pedido en la cabecera del display mientras el cajero arma el pedido:

```
🍽️ Pedido para comer aquí
  o
🥡 Pedido para llevar
```

Se envía por BroadcastChannel junto con los items del carrito.

### 6. Reportes

Agregar en el reporte de ventas:

- Columna `Tipo` en la tabla de ventas del día (`Comer aquí` / `Para llevar`)
- Resumen al pie:
  ```
  Total ventas:          Bs. 350
    └── Comer aquí:      Bs. 210  (X pedidos)
    └── Para llevar:     Bs. 140  (Y pedidos)
  ```
- Filtro por tipo de pedido en el rango de fechas

---

## Archivos a crear / modificar

### Base de datos
- [ ] `docs/database/migrations/011_order_type_and_recipe_condition.sql` — nueva migración
- [ ] `docs/database/schema-base.sql` — actualizar tras aplicar

### Backend / Lógica
- [ ] `src/lib/recipes.ts` — `deductStock` acepta y filtra por `orderType`
- [ ] `src/app/api/orders/route.ts` — recibe y guarda `order_type`

### Admin — Productos (recetas)
- [ ] `src/features/products/components/RecipeForm.tsx` (o equivalente) — agregar selector de condición por insumo
- [ ] `src/features/products/services/products.service.ts` — incluir `apply_condition` en insert/update de receta

### POS
- [ ] Modal de confirmación de venta — agregar selector de tipo de pedido (obligatorio)
- [ ] Enviar `order_type` al API al confirmar
- [ ] Enviar `order_type` por BroadcastChannel al display

### Display
- [ ] Mostrar tipo de pedido en cabecera cuando hay pedido activo

### Reportes
- [ ] `src/app/api/reports/sales/route.ts` — incluir `order_type` en respuesta y resumen
- [ ] `src/features/reports/` — columna y resumen por tipo de pedido

---

## Consideraciones

1. **Migración de datos**: las recetas existentes quedan con `apply_condition = 'always'` por el DEFAULT — sin cambio de comportamiento.
2. **Sin opción "sin especificar"**: el tipo de pedido es obligatorio, a diferencia del método de pago.
3. **Una vez confirmada la venta** el `order_type` no puede modificarse (integridad de inventario).
4. **Modal unificado**: el selector de tipo de pedido se integra en el mismo modal que el método de pago (módulo 13), no abre un modal extra.

---

## Criterios de Aceptación

- [ ] Campo `apply_condition` en `recipes` con valores `always | takeaway | dine_in` (default `always`)
- [ ] Campo `order_type` en `orders` con valores `dine_in | takeaway` (obligatorio)
- [ ] Al registrar una receta, el admin puede definir la condición de cada insumo
- [ ] Recetas existentes funcionan igual que antes (todas con `always`)
- [ ] El modal de confirmación del POS incluye selector de tipo de pedido (obligatorio antes de confirmar)
- [ ] Solo se descuentan del stock los insumos cuya condición aplica al tipo de pedido
- [ ] El display muestra el tipo de pedido en la cabecera del pedido activo
- [ ] El reporte de ventas incluye columna de tipo de pedido y resumen desglosado
