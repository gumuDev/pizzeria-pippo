# TASK: Número de Orden Diario por Sucursal

## Descripción
Reemplazar el ID interno de la orden (ej: `2c4a-44ac...`) por un número de orden legible y amigable que se reinicia cada día por sucursal. El cajero y el cocinero ven el mismo número para referirse al mismo pedido.

## Comportamiento esperado

```
Sucursal A — Lunes:
  Primera venta del día  → #01
  Segunda venta          → #02
  Tercera venta          → #03

Sucursal B — mismo Lunes:
  Primera venta del día  → #01   ← contador independiente
  Segunda venta          → #02

Sucursal A — Martes:
  Primera venta del día  → #01   ← se reinicia cada día
```

El número de orden NO reemplaza el `id` interno de la base de datos. Es un campo adicional solo para mostrar al usuario.

---

## Cambio en la base de datos

Agregar columna `daily_number` a la tabla `orders`:

```sql
-- migrations/NNN_add_daily_number_to_orders.sql

ALTER TABLE orders
  ADD COLUMN daily_number INTEGER NOT NULL DEFAULT 0;

-- índice para acelerar la consulta del último número del día
CREATE INDEX idx_orders_branch_date
  ON orders (branch_id, created_at);
```

---

## Lógica para calcular el número

Al momento de insertar una nueva orden, calcular el siguiente número del día para esa sucursal:

```typescript
// lib/orders.ts

async function getNextDailyNumber(branchId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0] // "2025-01-15"

  const { data } = await supabase
    .from('orders')
    .select('daily_number')
    .eq('branch_id', branchId)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)
    .order('daily_number', { ascending: false })
    .limit(1)
    .single()

  const lastNumber = data?.daily_number ?? 0
  return lastNumber + 1
}

// Al crear la orden
async function createOrder(branchId: string, ...) {
  const dailyNumber = await getNextDailyNumber(branchId)

  const { data: order } = await supabase
    .from('orders')
    .insert({
      branch_id: branchId,
      daily_number: dailyNumber,
      // ...resto de campos
    })
}
```

> **Importante:** Esta lógica asume bajo volumen concurrente (1 cajero por sucursal). Si en el futuro hubiera múltiples cajeros simultáneos en la misma sucursal, habría que usar una función PostgreSQL con `SELECT FOR UPDATE` para evitar números duplicados.

---

## Formato de visualización

El número se muestra con mínimo 2 dígitos con cero a la izquierda:

```typescript
// components/OrderNumber.tsx

const formatOrderNumber = (n: number): string => {
  return `#${String(n).padStart(2, '0')}`
}

// Ejemplos:
// 1  → #01
// 9  → #09
// 10 → #10
// 99 → #99
```

---

## Dónde se muestra

### POS — Sección "Pedidos del Día"
```
#01  10:32am  Pizza Mediana x2, Coca Cola x1   Bs. 48   [ ✓ Listo ]
#02  11:15am  Pizza Familiar x1                 Bs. 60   [ ✓ Listo ]
#03  12:45pm  Pizza Personal x3, Sprite x2      Bs. 91   [ Marcar listo ]
```

### POS — Confirmación de venta
Al confirmar una venta, el mensaje de éxito muestra el número de orden:
```
✓ Venta registrada
  Orden #03
```

### Kitchen Display (Cocina)
El número de orden aparece en la esquina superior izquierda de cada tarjeta:
```
┌─────────────────────────────┐
│  #03  •  12:45pm  •  🕐 5min │
│─────────────────────────────│
│ Pizza Napolitana  Mediana x2 │
│ → Tomate, 4 quesos, choclo  │
└─────────────────────────────┘
```

---

## Criterios de Aceptación

- [ ] Campo `daily_number` agregado en la tabla `orders`
- [ ] El primer pedido del día de cada sucursal siempre empieza en #01
- [ ] El contador de Sucursal A y Sucursal B son completamente independientes
- [ ] El contador se reinicia automáticamente cada día sin intervención manual
- [ ] El número se muestra con formato `#01`, `#02`, nunca como UUID o ID interno
- [ ] El número aparece en la confirmación de venta en el POS
- [ ] El número aparece en la lista "Pedidos del Día" del POS
- [ ] El número aparece en cada tarjeta del Kitchen Display
- [ ] El cajero de Sucursal A y el cocinero de Sucursal A ven el mismo número para la misma orden