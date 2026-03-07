# 05 — Inventario

## Objetivo
Gestión de insumos, stock por sucursal, movimientos y alertas de stock bajo.

> **Prioridad en configuración inicial:** Los insumos deben registrarse **antes** de crear productos, ya que las recetas del Paso 3 dependen de insumos existentes. Orden: sucursales → **insumos** → productos → stock inicial → promociones → cajeros.

## Tareas

### Insumos (`app/(admin)/ingredients/page.tsx`)
- [x] Tabla de insumos: nombre, unidad de medida
- [x] Crear/editar/eliminar insumos
- [x] Unidades soportadas: g, kg, ml, l, unidad

### Stock por sucursal (`app/(admin)/stock/page.tsx`)
- [x] Vista de stock actual por insumo y sucursal
- [x] Indicador visual de stock bajo (rojo si `quantity < min_quantity`)
- [x] Filtro por sucursal (selector en header)
- [x] Badge de alerta en header si hay insumos bajo mínimo

### Compras (entrada de stock)
- [x] Formulario: insumo + cantidad + sucursal
- [x] Al guardar: suma a `branch_stock.quantity`
- [x] Registra en `stock_movements` con `type = 'compra'`

### Ajuste manual de stock
- [x] Formulario: insumo + cantidad real (conteo físico) + sucursal + motivo
- [x] Calcula diferencia vs sistema y registra en `stock_movements` con `type = 'ajuste'`
- [x] Actualiza `branch_stock.quantity` con el valor real

### Descuento automático al vender
- [x] `src/lib/recipes.ts` — función `deductStock(orderId, branchId, token)`
- [x] Por cada `order_item`: busca receta de la variante, descuenta insumos de `branch_stock`
- [x] Registra cada descuento en `stock_movements` con `type = 'venta'`
- [x] Stock nunca baja de 0 (Math.max)

### Configuración de stock mínimo
- [x] Clic en el valor mínimo abre modal para editar `min_quantity`
- [x] Se actualiza directamente en `branch_stock`

### Alertas de stock bajo
- [x] Filtro client-side: `quantity < min_quantity`
- [x] Badge de alerta en header de la página de stock
- [x] Filas en rojo si están bajo mínimo

### Historial de movimientos
- [x] Tabla de `stock_movements` con últimos 200 movimientos
- [x] Filtro por sucursal
- [x] Columnas: fecha, insumo, tipo (compra/venta/ajuste), cantidad (+/-), notas

### API routes
- [x] `GET /api/stock?branchId=` — stock actual por sucursal
- [x] `POST /api/stock/purchase` — registrar compra
- [x] `POST /api/stock/adjust` — ajuste manual
- [x] `GET /api/stock/alerts?branchId=` — insumos bajo mínimo
- [x] `GET /api/stock/movements?branchId=` — historial de movimientos

## Resultado esperado
Stock actualizado automáticamente con cada venta. Admin puede registrar compras, hacer ajustes y ver alertas de stock bajo.
