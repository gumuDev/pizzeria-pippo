# Motor de Promociones

## Visión general

El sistema de promociones es un motor basado en reglas `condición → beneficio` que opera **automáticamente** en el POS. El cajero no hace nada manual: al abrir el POS, el sistema detecta las promos vigentes del día y las aplica solas al armar el carrito.

Archivos relevantes:
- `src/lib/promotions.ts` — lógica pura, sin dependencias de UI
- `src/app/(admin)/promotions/page.tsx` — gestión desde el panel admin
- `src/app/api/promotions/route.ts` — API REST (GET, POST)
- `src/app/api/promotions/[id]/route.ts` — API REST (PUT, PATCH, DELETE)

---

## Estructura de datos

### Tabla `promotions`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | Nombre visible en el admin y en el label del POS |
| `type` | enum | `BUY_X_GET_Y` \| `PERCENTAGE` \| `COMBO` |
| `days_of_week` | int[] | Días en que aplica: 0=Dom, 1=Lun … 6=Sáb. Array vacío = todos los días |
| `start_date` | date | Inicio de vigencia |
| `end_date` | date | Fin de vigencia |
| `branch_id` | uuid \| null | Sucursal específica. `null` = aplica a todas |
| `active` | boolean | Switch rápido para pausar/reanudar sin borrar |

### Tabla `promotion_rules`

Cada promoción tiene una o más reglas. Los campos que se usan varían según el tipo:

| Campo | BUY_X_GET_Y | PERCENTAGE | COMBO |
|---|---|---|---|
| `variant_id` | Variante a la que aplica (requerido) | Variante específica o `null` (todos) | Cada producto del combo |
| `buy_qty` | Cantidad que paga el cliente | — | — |
| `get_qty` | Cantidad gratis | — | — |
| `discount_percent` | — | Porcentaje de descuento (1–100) | — |
| `combo_price` | — | — | Precio especial total (solo en regla 0) |

---

## Tipos de promoción

### 1. BUY_X_GET_Y — Compra X llévate Y gratis

El cliente paga `buy_qty` unidades y recibe `buy_qty + get_qty` unidades físicas.

**Comportamiento en el carrito:**
- El cajero ingresa solo las unidades que el cliente **paga** (ej: 2)
- El sistema calcula internamente las unidades físicas: `qty_physical = paid + freeUnits`
- El descuento se registra como el precio de las unidades gratuitas
- El stock se descuenta por `qty_physical` (todas las unidades que salen de cocina)

**Ejemplo — 2x1 Pizza Mediana los miércoles:**
```
Configuración:
  nombre:     "2x1 Miércoles"
  tipo:       BUY_X_GET_Y
  días:       [3]  (miércoles)
  vigencia:   2025-01-01 → 2025-12-31
  sucursal:   Todas
  regla:
    variant_id:  <id de Pizza Mediana>
    buy_qty:     2
    get_qty:     1

Resultado en el carrito (cajero ingresa 2 pizzas):
  qty ingresado por cajero: 2
  qty_physical (cocina):    3
  precio unitario:          Bs 45
  descuento aplicado:       Bs 45  (1 pizza gratis)
  total cobrado:            Bs 90
  label en pantalla:        "3x2 — 2x1 Miércoles"
```

**Ejemplo — 4+1 gratis:**
```
  buy_qty: 4
  get_qty: 1

  Cajero ingresa 4 → cocina prepara 5, cliente paga 4.
  Cajero ingresa 8 → cocina prepara 10, cliente paga 8.
```

---

### 2. PERCENTAGE — Descuento porcentual

Aplica un porcentaje de descuento sobre el precio total del ítem.

Si `variant_id` es `null`, el descuento aplica a **todos los productos del carrito**.

**Ejemplo — 20% OFF en bebidas los domingos:**
```
Configuración:
  nombre:     "Domingo refrescante"
  tipo:       PERCENTAGE
  días:       [0]  (domingo)
  regla:
    variant_id:      <id de Coca-Cola 500ml>
    discount_percent: 20

Resultado (cajero agrega 3 Coca-Cola a Bs 15 c/u):
  subtotal original:  Bs 45
  descuento (20%):    Bs 9
  total cobrado:      Bs 36
  label:              "20% OFF — Domingo refrescante"
```

**Ejemplo — 10% OFF en todo el carrito:**
```
  variant_id:       null   ← aplica a todos los ítems
  discount_percent: 10
```

---

### 3. COMBO — Precio especial por combinación

Activa cuando **todos** los productos de las reglas están presentes en el carrito. El precio especial se distribuye proporcionalmente entre los ítems del combo.

El `combo_price` se define en la **primera regla** (regla 0) y aplica al total del combo completo.

**Ejemplo — Combo Familiar: pizza grande + 2 bebidas = Bs 120:**
```
Configuración:
  nombre:     "Combo Familiar"
  tipo:       COMBO
  días:       []   (todos los días)
  reglas:
    regla 0:  variant_id: <Pizza Familiar>  combo_price: 120
    regla 1:  variant_id: <Coca-Cola 1.5L>
    regla 2:  variant_id: <Agua 500ml>

Precios originales:
  Pizza Familiar:  Bs 80
  Coca-Cola 1.5L:  Bs 30
  Agua 500ml:      Bs 15
  Total original:  Bs 125

Precio combo:      Bs 120
Descuento total:   Bs 5

Distribución proporcional:
  Pizza:      Bs 5 × (80/125) = Bs 3.20 de descuento
  Coca-Cola:  Bs 5 × (30/125) = Bs 1.20 de descuento
  Agua:       Bs 5 × (15/125) = Bs 0.60 de descuento
```

> Si alguno de los productos del combo no está en el carrito, la promo no aplica.

---

## Lógica de aplicación

### Filtrado de promos activas — `getActivePromotions()`

Para que una promo aplique, debe cumplir **todas** estas condiciones:
1. `active = true`
2. La fecha actual está entre `start_date` y `end_date`
3. El día actual está en `days_of_week` (o el array está vacío)
4. `branch_id` es `null` (todas las sucursales) o coincide con la sucursal del cajero

La fecha se evalúa en **hora boliviana (UTC-4)** para evitar que las promos del domingo se activen el sábado a las 20:00 UTC.

### Aplicación al carrito — `applyPromotions()`

- Cada ítem del carrito recibe **como máximo una promo** (no hay acumulación)
- Si un ítem califica para dos promos, gana la que genera **mayor descuento**
- Las promos se procesan en el orden en que llegan desde la API

### Cálculo del total — `getCartTotal()`

```
total = Σ (unit_price × qty_physical - discount_applied)
```

`qty_physical` en BUY_X_GET_Y es mayor que `qty` porque incluye las unidades gratuitas que salen de cocina. En PERCENTAGE y COMBO, `qty_physical = qty`.

---

## Ciclo de vida de una promoción

```
Crear (admin) → activa=true
      ↓
  POS la detecta automáticamente si fecha y día coinciden
      ↓
  Pausar/reanudar: switch "Activa" en la tabla del admin
      ↓
  Vence: end_date < hoy → deja de aparecer en el POS
```

---

## Reglas de negocio importantes

- Una promo con `branch_id = null` aplica a **todas** las sucursales simultáneamente
- Cambiar `active = false` pausa la promo sin borrarla — útil para promos estacionales
- El campo `days_of_week` vacío (`[]`) significa que aplica todos los días dentro de la vigencia
- El stock siempre se descuenta por `qty_physical`, no por la cantidad que paga el cliente
- Los cajeros nunca ven la configuración de las promos, solo el label en el carrito (ej: `"3x2 — 2x1 Miércoles"`)
