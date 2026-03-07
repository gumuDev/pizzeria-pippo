# TASK: Bodega Central y Transferencias a Sucursales

## Descripción
Agregar una bodega central que actúa como punto de entrada de todos los insumos. Las compras siempre entran a la bodega primero. El admin transfiere insumos de la bodega a cada sucursal según necesite. Las ventas en el POS siguen descontando del stock de la sucursal como antes.

## Flujo completo

```
ANTES:
  Compra → entra directo a Sucursal A o B

AHORA:
  Compra → entra a Bodega Central
  Admin transfiere Bodega → Sucursal A o B
  Venta en POS → descuenta de Sucursal A o B (sin cambio)
```

---

## Vista general de stock

Con este modelo el admin puede ver tres niveles:

```
Tomate:
  Bodega Central:  3000g   ← lo que hay disponible para distribuir
  Sucursal A:      1200g   ← lo que tiene la sucursal para producir
  Sucursal B:       800g   ← lo que tiene la sucursal para producir
  ─────────────────────────
  Total:           5000g
```

---

## Cambios en la base de datos

Alineado con el schema real del proyecto (español para valores de type, convenciones de Supabase con `public.` y `uuid`).

```sql
-- migrations/NNN_add_warehouse.sql

-- 1. Stock de la bodega central
CREATE TABLE public.warehouse_stock (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity numeric NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT warehouse_stock_pkey PRIMARY KEY (id),
  CONSTRAINT warehouse_stock_ingredient_id_fkey
    FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT warehouse_stock_ingredient_unique UNIQUE (ingredient_id)
);

-- 2. Movimientos de bodega
--    type en español para consistencia con stock_movements existente
CREATE TABLE public.warehouse_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL,
  quantity numeric NOT NULL,
  type text NOT NULL CHECK (type = ANY (
    ARRAY['compra'::text, 'transferencia'::text, 'ajuste'::text]
  )),
  -- branch_id solo se llena cuando type = 'transferencia'
  branch_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT warehouse_movements_pkey PRIMARY KEY (id),
  CONSTRAINT warehouse_movements_ingredient_fkey
    FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT warehouse_movements_branch_fkey
    FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT warehouse_movements_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- 3. Agregar origin a stock_movements existente
--    para saber si el movimiento de la sucursal vino de bodega, venta o ajuste
ALTER TABLE public.stock_movements
  ADD COLUMN origin text CHECK (origin = ANY (
    ARRAY['transferencia'::text, 'venta'::text, 'ajuste'::text]
  ));

-- 4. Migrar registros existentes
--    los movimientos anteriores eran tipo 'compra' directa → los marcamos como 'transferencia'
--    los de tipo 'venta' y 'ajuste' se mapean directo
UPDATE public.stock_movements
  SET origin = CASE
    WHEN type = 'compra'  THEN 'transferencia'
    WHEN type = 'venta'   THEN 'venta'
    WHEN type = 'ajuste'  THEN 'ajuste'
  END
WHERE origin IS NULL;

-- índice para acelerar historial de movimientos de bodega
CREATE INDEX idx_warehouse_movements_ingredient
  ON public.warehouse_movements (ingredient_id, created_at);
```

> **Nota sobre stock_movements:** El campo `type` existente en `stock_movements` conserva sus valores originales ('compra', 'venta', 'ajuste'). El nuevo campo `origin` indica la causa real del movimiento desde la perspectiva de la bodega. A partir de esta migración, los ingresos a sucursales ya no serán tipo 'compra' sino que vendrán siempre de una 'transferencia' desde bodega.

---

## Flujos del sistema

### Flujo 1 — Registrar compra en bodega

```
Admin → Bodega → Nueva compra
  → selecciona insumo: Tomate
  → cantidad: 5000g
  → notas opcionales: "Proveedor X, factura #123"

→ suma 5000g a warehouse_stock del Tomate
→ registra en warehouse_movements tipo 'compra'
```

### Flujo 2 — Transferir de bodega a sucursal

```
Admin → Bodega → Nueva transferencia
  → selecciona insumo: Tomate
  → cantidad: 2000g
  → destino: Sucursal A

→ valida que bodega tiene suficiente stock (≥ 2000g)
  └── si no hay suficiente → error: "Stock insuficiente en bodega. Disponible: 1500g"

→ descuenta 2000g de warehouse_stock del Tomate
→ suma 2000g al branch_stock de Sucursal A
→ registra en warehouse_movements tipo 'transferencia' con branch_id = Sucursal A
→ registra en stock_movements de Sucursal A tipo 'compra' con origin = 'transferencia'
```

### Flujo 3 — Venta en POS (sin cambio)

```
Cajero vende Pizza Mediana en Sucursal A
→ descuenta receta del branch_stock de Sucursal A
→ registra en stock_movements de Sucursal A tipo 'venta' con origin = 'venta'
→ la bodega NO se afecta
```

### Flujo 4 — Ajuste manual de bodega

```
Admin hace conteo físico de la bodega
→ Admin → Bodega → Ajuste manual
→ ingresa cantidad real
→ corrige warehouse_stock
→ registra en warehouse_movements tipo 'ajuste'
```

---

## Panel de Bodega en el Admin

### Nueva sección en el menú del admin: "Bodega"

```
/admin/warehouse              ← resumen general de stock
/admin/warehouse/purchase     ← registrar nueva compra
/admin/warehouse/transfer     ← transferir a sucursal
/admin/warehouse/movements    ← historial de movimientos
```

### Vista principal de bodega (/admin/warehouse)

Tabla con el estado actual de cada insumo en todas las ubicaciones:

```
Insumo        Bodega    Sucursal A   Sucursal B   Total
──────────────────────────────────────────────────────
Tomate        3000g       1200g        800g       5000g  ⚠️
Harina        8000g       2500g       2000g      12500g
Queso         4000g       1800g       1200g       7000g
Pepperoni     2000g        800g        600g       3400g
```

- Alerta ⚠️ cuando cualquier ubicación está por debajo de su `min_quantity`
- Botón "Transferir" por fila para acción rápida

### Vista de transferencia (/admin/warehouse/transfer)

```
Insumo:       [ Tomate ▼ ]
Cantidad:     [ 2000 ] g
Destino:      [ Sucursal A ▼ ]
Notas:        [ opcional ]

Disponible en bodega: 3000g   ← se actualiza al seleccionar el insumo

[ Confirmar transferencia ]
```

### Historial de movimientos (/admin/warehouse/movements)

```
Fecha         Tipo           Insumo     Cantidad    Destino      Notas
──────────────────────────────────────────────────────────────────────
15/01 10:00   Compra         Tomate     +5000g      —            Proveedor X
15/01 11:30   Transferencia  Tomate     -2000g      Sucursal A   —
15/01 12:00   Transferencia  Tomate     -1000g      Sucursal B   —
16/01 09:00   Ajuste         Tomate     -200g       —            Conteo físico
```

Filtros: por tipo, por insumo, por fecha, por destino.

---

## Validaciones

- No se puede transferir más de lo disponible en bodega → error con cantidad actual
- No se puede registrar compra con cantidad 0 o negativa
- No se puede transferir a una sucursal con `is_active = false`
- Insumos con `is_active = false` no aparecen en los formularios de bodega

---

## Alertas de stock bajo

Se configuran por separado para bodega y para cada sucursal usando `min_quantity`:

| Tabla | Campo | Descripción |
|---|---|---|
| `warehouse_stock` | `min_quantity` | Mínimo en bodega central |
| `branch_stock` | `min_quantity` | Mínimo en cada sucursal (ya existe) |

Todas las alertas aparecen en el dashboard del admin.

---

## Estructura de archivos

```
app/
  (admin)/
    warehouse/
      page.tsx           ← resumen general: bodega + sucursales + totales
      purchase/
        page.tsx         ← registrar compra en bodega
      transfer/
        page.tsx         ← transferir insumos a sucursal
      movements/
        page.tsx         ← historial de movimientos de bodega
lib/
  warehouse.ts           ← lógica de compras, transferencias y ajustes
```

---

## Criterios de Aceptación

- [ ] Tabla `warehouse_stock` creada, con registro por cada insumo activo en 0 al inicio
- [ ] Tabla `warehouse_movements` creada y registra todos los movimientos
- [ ] Campo `origin` agregado a `stock_movements` con valores en español
- [ ] Registrar una compra suma el stock a la bodega correctamente
- [ ] Transferencia descuenta de `warehouse_stock` y suma a `branch_stock` en operación atómica
- [ ] No se puede transferir más de lo disponible en bodega → muestra error con cantidad actual
- [ ] Las ventas en el POS siguen descontando de `branch_stock`, la bodega no se afecta
- [ ] Vista principal muestra bodega, Sucursal A, Sucursal B y total por insumo
- [ ] Alertas de stock bajo por `min_quantity` en bodega y en cada sucursal
- [ ] Historial de movimientos con filtros por tipo, insumo, fecha y destino
- [ ] Solo el admin puede acceder a la sección de bodega