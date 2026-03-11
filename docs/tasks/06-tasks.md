# Tareas — Módulo 14: Tipo de Pedido y Descuento Condicional

## Orden de ejecución

Las tareas siguen el orden de dependencia: primero la BD, luego el backend, luego el frontend.

---

## PASO 1 — Base de Datos

### 1.1 Crear archivo de migración
- [x] Crear `docs/database/migrations/011_order_type_and_recipe_condition.sql`
  - `orders.order_type` — `text NOT NULL DEFAULT 'dine_in'` con CHECK `('dine_in', 'takeaway')`
  - `recipes.apply_condition` — `text NOT NULL DEFAULT 'always'` con CHECK `('always', 'dine_in', 'takeaway')`

### 1.2 Aplicar en Supabase
- [ ] Aplicar la migración manualmente en el SQL Editor de Supabase
- [x] Actualizar `docs/database/schema-base.sql` con los dos campos nuevos

---

## PASO 2 — Backend: Lógica de descuento

### 2.1 Actualizar `src/lib/recipes.ts`
- [x] Agregar `OrderType = 'dine_in' | 'takeaway'` al tipo de parámetros de `deductStock`
- [x] Filtrar los insumos de la receta antes de descontar:
  ```
  item.apply_condition === 'always'  → siempre incluir
  item.apply_condition === orderType → incluir solo si coincide
  ```

### 2.2 Actualizar `src/app/api/orders/route.ts`
- [x] Recibir `order_type` en el body del POST
- [x] Validar que `order_type` sea `'dine_in'` o `'takeaway'`
- [x] Pasar `order_type` a `deductStock`
- [x] Guardar `order_type` en el INSERT de `orders`

---

## PASO 3 — Admin: Selector de condición en recetas

### 3.1 Actualizar el formulario de recetas (Paso 3 del registro de producto)
- [x] Agregar campo `apply_condition` a cada fila de insumo en la receta
- [x] Selector con opciones: Siempre / Solo para llevar / Solo para comer aquí
- [x] Default: "Siempre"
- [x] Agregar tooltip: "Define cuándo se descuenta este insumo del inventario"

### 3.2 Actualizar el service de productos
- [x] Incluir `apply_condition` en el INSERT/UPDATE de `recipes`
- [x] Al cargar una receta existente, leer y mostrar `apply_condition` correctamente

---

## PASO 4 — POS: Selector de tipo de pedido

### 4.1 Actualizar el modal de confirmación de venta
- [x] Agregar sección "¿Cómo va el pedido?" con dos botones: 🍽️ Comer aquí / 🥡 Para llevar
- [x] Integrar en el mismo modal donde ya está el selector de método de pago
- [x] El botón "Confirmar" queda deshabilitado hasta que se seleccione tipo de pedido
- [x] Ningún tipo seleccionado por defecto (fuerza elección consciente)

### 4.2 Enviar order_type al API
- [x] Incluir `order_type` en el body del POST a `/api/orders`

### 4.3 Enviar order_type por BroadcastChannel
- [x] Incluir `order_type` en el mensaje que se envía al display al armar/actualizar el pedido

---

## PASO 5 — Display: Mostrar tipo de pedido

### 5.1 Actualizar `src/app/display/page.tsx`
- [x] Leer `order_type` del mensaje recibido por BroadcastChannel
- [x] Mostrar en la cabecera del pedido activo:
  - `dine_in` → 🍽️ Pedido para comer aquí
  - `takeaway` → 🥡 Pedido para llevar
- [x] No mostrar nada cuando está en modo menú (sin pedido activo)

---

## PASO 6 — Reportes

### 6.1 Actualizar `src/app/api/reports/sales/route.ts`
- [x] Incluir `order_type` en la consulta
- [x] Retornar desglose: `{ dine_in: { total, count }, takeaway: { total, count } }`

### 6.2 Actualizar la vista de reportes
- [x] Agregar columna "Tipo" en la tabla de ventas del día (Comer aquí / Para llevar)
- [x] Agregar resumen al pie con desglose por tipo:
  ```
  Total ventas:        Bs. 350
    └── Comer aquí:    Bs. 210  (X pedidos)
    └── Para llevar:   Bs. 140  (Y pedidos)
  ```

---

## Resumen de archivos

| Archivo | Acción |
|---------|--------|
| `docs/database/migrations/011_order_type_and_recipe_condition.sql` | Crear |
| `docs/database/schema-base.sql` | Actualizar |
| `src/lib/recipes.ts` | Modificar |
| `src/app/api/orders/route.ts` | Modificar |
| Formulario de recetas (paso 3 de productos) | Modificar |
| Service de productos | Modificar |
| Modal de confirmación del POS | Modificar |
| `src/app/display/page.tsx` | Modificar |
| `src/app/api/reports/sales/route.ts` | Modificar |
| Vista de reportes | Modificar |

---

## Notas

- Las recetas existentes no se rompen: el DEFAULT `'always'` en la migración mantiene el comportamiento histórico.
- El tipo de pedido es **obligatorio** (a diferencia del método de pago que acepta NULL).
- No crear un modal separado para el tipo de pedido — va en el mismo modal de confirmación que ya existe.
