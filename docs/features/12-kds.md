# TASK: Kitchen Display System (KDS)

## Descripción
Cuando el cajero confirma una venta, el pedido aparece automáticamente en la pantalla/tablet de la cocina. El cocinero ve todos los pedidos pendientes y el cajero marca manualmente cuándo un pedido está listo.

---

## Arquitectura de Comunicación

El POS y la cocina son dispositivos distintos (PC cajero → tablet cocina), por lo tanto se usa **Supabase Realtime** para sincronización en tiempo real entre ambos.

```
[PC Cajero]                          [Tablet Cocina]
  confirma venta
       ↓
  inserta orden en Supabase
       ↓
  Supabase Realtime emite evento  →  tablet recibe pedido al instante
                                          ↓
                                     muestra en pantalla KDS

  cajero marca "listo"             ←  cajero ve notificación
       ↑
  actualiza orden status = "ready"
       ↑
  Supabase Realtime emite evento
```

---

## Estados de un Pedido en Cocina

```
pending   → El cajero confirmó la venta, el cocinero aún no lo ve o está pendiente
preparing → (futuro opcional) el cocinero lo tomó
ready     → El cajero marcó el pedido como listo
```

Por ahora solo se usan `pending` y `ready`.

### Cambio en la tabla orders

```sql
ALTER TABLE orders
  ADD COLUMN kitchen_status VARCHAR(20) DEFAULT 'pending';
  -- valores: 'pending' | 'ready'
```

---

## Pantalla KDS (Tablet Cocina)

### Ruta
`/kitchen` — pantalla exclusiva para la cocina, optimizada para tablet.

### Acceso
- Rol nuevo: `cocinero` — solo puede acceder a `/kitchen`
- La sucursal se asigna igual que al cajero: automática por cuenta, no se selecciona

### Layout
Tarjetas en grilla, una tarjeta por pedido pendiente:

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  #003  •  12:45pm  •  🕐 5min│  │  #004  •  12:52pm  •  🕐 2min│
│─────────────────────────────│  │─────────────────────────────│
│ Pizza Napolitana  Mediana x2│  │ Pizza Familiar           x1 │
│ → Tomate, 4 quesos, choclo  │  │ → Pepperoni, mozzarella     │
│                             │  │                             │
│ Pizza Personal           x1 │  │ Coca Cola                x2 │
│ → Pepperoni, mozzarella     │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
```

### Comportamiento
- Las tarjetas aparecen automáticamente al confirmarse una venta (Supabase Realtime)
- Ordenadas de la más antigua a la más nueva (primero entró, primero se atiende)
- Cada tarjeta muestra un temporizador desde que entró el pedido
- Tarjetas con más de 10 minutos sin atender se resaltan en color de alerta (ej: rojo)
- Cuando el cajero marca el pedido como listo, la tarjeta desaparece de la pantalla

### Información por tarjeta
| Campo | Ejemplo |
|---|---|
| Número de orden | #003 |
| Hora de entrada | 12:45pm |
| Temporizador | 🕐 5 min |
| Producto + tamaño | Pizza Napolitana — Mediana x2 |
| Ingredientes | → Tomate, 4 quesos, choclo |
| Producto + tamaño | Pizza Pepperoni — Personal x1 |
| Ingredientes | → Pepperoni, mozzarella |

> La descripción de ingredientes viene del campo `description` de la tabla `products` — es la descripción visible para el cliente, no los gramos internos de la receta. El cocinero nunca ve gramos.

---

## Pantalla POS — Sección Pedidos del Día

En la sección "Pedidos del Día" del POS, cada orden muestra su estado de cocina y el cajero puede marcarlo como listo:

```
#001  10:32am  Pizza Mediana x2, Coca Cola x1   Bs. 48   [ ✓ Listo ]
#002  11:15am  Pizza Familiar x1                 Bs. 60   [ ✓ Listo ]
#003  12:45pm  Pizza Personal x3, Sprite x2      Bs. 91   [ Marcar listo ]  ← pendiente
```

- Pedidos con `kitchen_status = 'pending'` muestran botón **"Marcar listo"**
- Al hacer clic, el sistema actualiza `kitchen_status = 'ready'`
- Supabase Realtime notifica a la tablet de cocina y la tarjeta desaparece
- Pedidos ya listos muestran checkmark verde

---

## Implementación Supabase Realtime

### En el POS — emitir nuevo pedido al confirmar venta
```typescript
// Al insertar la orden, Supabase Realtime lo propaga automáticamente
// No se necesita código extra si la suscripción en cocina está activa
const { data: order } = await supabase
  .from('orders')
  .insert({ branch_id, cashier_id, total, kitchen_status: 'pending' })
  .select()
  .single()
```

### En la tablet de cocina — query inicial al cargar la pantalla
```typescript
// Carga los pedidos pendientes al abrir /kitchen
const { data } = await supabase
  .from('orders')
  .select(`
    id,
    created_at,
    kitchen_status,
    order_items (
      quantity_physical,
      product_variants (
        name,
        products (
          name,
          description
        )
      )
    )
  `)
  .eq('branch_id', branchId)
  .eq('kitchen_status', 'pending')
  .order('created_at', { ascending: true })
```

### En la tablet de cocina — escuchar nuevos pedidos en tiempo real
```typescript
// /kitchen/page.tsx
useEffect(() => {
  const channel = supabase
    .channel('kitchen-orders')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
      filter: `branch_id=eq.${branchId}`
    }, (payload) => {
      // agregar nueva tarjeta al estado local
      addOrder(payload.new)
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `branch_id=eq.${branchId}`
    }, (payload) => {
      // si kitchen_status cambió a 'ready', eliminar tarjeta
      if (payload.new.kitchen_status === 'ready') {
        removeOrder(payload.new.id)
      }
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

### En el POS — marcar pedido como listo
```typescript
await supabase
  .from('orders')
  .update({ kitchen_status: 'ready' })
  .eq('id', orderId)
// Supabase Realtime notifica automáticamente a la tablet de cocina
```

---

## Nuevo Rol: cocinero

```
Roles del sistema:
  admin    → todo el sistema, ambas sucursales
  cajero   → solo /pos de su sucursal
  cocinero → solo /kitchen de su sucursal   ← nuevo
```

RLS en Supabase: el cocinero solo puede leer órdenes de su sucursal y no puede modificar nada excepto escuchar el canal Realtime.

---

## Estructura de Archivos

```
app/
  kitchen/
    page.tsx          ← pantalla KDS para la tablet de cocina
  (pos)/
    pos/
      page.tsx        ← agregar columna kitchen_status y botón "Marcar listo"
lib/
  kitchen.ts          ← lógica de suscripción Realtime y manejo de estados
```

---

## Criterios de Aceptación

- [ ] Campo `kitchen_status` agregado en tabla `orders` con valor default `pending`
- [ ] Rol `cocinero` creado con acceso solo a `/kitchen` de su sucursal
- [ ] Al confirmar una venta en el POS, la tarjeta aparece en la tablet de cocina en tiempo real
- [ ] Cada tarjeta muestra: número de orden, hora, temporizador, nombre del producto con tamaño, cantidad e ingredientes visibles
- [ ] Tarjetas ordenadas de la más antigua a la más nueva
- [ ] Tarjetas con más de 10 minutos se resaltan visualmente en rojo
- [ ] En "Pedidos del Día" del POS, los pedidos pendientes muestran botón "Marcar listo"
- [ ] Al marcar listo desde el POS, la tarjeta desaparece de la tablet de cocina en tiempo real
- [ ] La tablet de cocina solo muestra pedidos de su propia sucursal