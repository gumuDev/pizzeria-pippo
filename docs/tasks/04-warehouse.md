# TASK: Bodega Central y Transferencias a Sucursales

Feature doc: `docs/features/13-warehouse.md`
Migración: `docs/database/migrations/007_add_warehouse.sql`

---

## Subtareas

### T1 — Migración de base de datos
Archivo: `docs/database/migrations/007_add_warehouse.sql`

- Crear tabla `warehouse_stock` (ingredient_id, quantity, min_quantity)
- Crear tabla `warehouse_movements` (ingredient_id, quantity, type, branch_id, notes, created_by)
- Agregar columna `origin` a `stock_movements`
- Migrar registros existentes de `stock_movements` (origin según type)
- Crear índice `idx_warehouse_movements_ingredient`
- Actualizar `docs/database/schema-base.sql`

### T2 — Lógica de negocio (`src/lib/warehouse.ts`)

Funciones:
- `registerPurchase(ingredientId, quantity, notes, userId)` — suma a warehouse_stock, registra en warehouse_movements tipo 'compra'
- `transferToBaranch(ingredientId, quantity, branchId, notes, userId)` — atómico: descuenta warehouse_stock, suma branch_stock, registra en ambas tablas
- `adjustWarehouseStock(ingredientId, quantity, notes, userId)` — corrige warehouse_stock, registra en warehouse_movements tipo 'ajuste'
- `getWarehouseStock()` — retorna warehouse_stock con datos del insumo
- `getWarehouseMovements(filters)` — historial con filtros opcionales (type, ingredientId, dateFrom, dateTo, branchId)

Validaciones:
- No transferir más de lo disponible → error con cantidad actual
- No registrar compra con cantidad ≤ 0
- No transferir a sucursal inactiva
- No mostrar insumos inactivos en formularios

### T3 — API Routes

- `POST /api/warehouse/purchase` — registrar compra en bodega
- `POST /api/warehouse/transfer` — transferir a sucursal
- `POST /api/warehouse/adjust` — ajuste manual
- `GET  /api/warehouse/stock` — stock actual de bodega
- `GET  /api/warehouse/movements` — historial con filtros (?type=&ingredientId=&from=&to=&branchId=)

Todas usan `Authorization: Bearer <token>` y solo accesibles para rol `admin`.

### T4 — Vista principal `/admin/warehouse`

Archivo: `src/app/(admin)/warehouse/page.tsx`

Tabla con columnas: Insumo | Bodega | Sucursal A | Sucursal B | Total
- Alerta ⚠️ cuando cualquier ubicación está por debajo de min_quantity
- Botón "Transferir" por fila (link a /admin/warehouse/transfer?ingredientId=...)
- Botón "Nueva compra" en header

### T5 — Vista de compra `/admin/warehouse/purchase`

Archivo: `src/app/(admin)/warehouse/purchase/page.tsx`

Formulario:
- Insumo (select, solo activos)
- Cantidad
- Notas (opcional)
- Confirmar → llama POST /api/warehouse/purchase

### T6 — Vista de transferencia `/admin/warehouse/transfer`

Archivo: `src/app/(admin)/warehouse/transfer/page.tsx`

Formulario:
- Insumo (select, solo activos; pre-seleccionado si viene ?ingredientId=)
- Cantidad
- Destino (select de sucursales activas)
- Notas (opcional)
- Mostrar "Disponible en bodega: Xg" al seleccionar insumo
- Confirmar → llama POST /api/warehouse/transfer
- Error inline si stock insuficiente

### T7 — Vista de historial `/admin/warehouse/movements`

Archivo: `src/app/(admin)/warehouse/movements/page.tsx`

Tabla: Fecha | Tipo | Insumo | Cantidad | Destino | Notas
Filtros: tipo, insumo, fecha desde/hasta, destino (sucursal)

### T8 — Navegación y menú admin

- Agregar "Bodega" al menú lateral del admin layout
- Registrar el resource `warehouse` en Refine (o agregar link manual si no es CRUD puro)

### T9 — Alertas en dashboard

- Incluir alertas de stock bajo de bodega (`warehouse_stock.quantity < warehouse_stock.min_quantity`) en el dashboard del admin junto con las alertas de sucursales existentes

---

## Orden de implementación

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9
```

T1 debe aplicarse en Supabase antes de continuar con T2+.
T2 y T3 pueden desarrollarse en paralelo una vez T1 esté aplicada.
T4–T7 dependen de T3.
T8 y T9 son independientes y pueden hacerse al final.

---

## Criterios de Aceptación

- [ ] Tabla `warehouse_stock` creada con registro por cada insumo activo en 0 al inicio
- [ ] Tabla `warehouse_movements` creada y registra todos los movimientos
- [ ] Campo `origin` agregado a `stock_movements` con valores en español
- [ ] Registrar una compra suma el stock a la bodega correctamente
- [ ] Transferencia descuenta de `warehouse_stock` y suma a `branch_stock` en operación atómica
- [ ] No se puede transferir más de lo disponible → muestra error con cantidad actual
- [ ] Las ventas en el POS siguen descontando de `branch_stock`, la bodega no se afecta
- [ ] Vista principal muestra bodega, Sucursal A, Sucursal B y total por insumo
- [ ] Alertas de stock bajo por `min_quantity` en bodega y en cada sucursal
- [ ] Historial de movimientos con filtros por tipo, insumo, fecha y destino
- [ ] Solo el admin puede acceder a la sección de bodega
