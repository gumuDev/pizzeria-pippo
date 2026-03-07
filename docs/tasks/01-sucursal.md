# TASK: Implementar Soft Delete

## Descripción
Implementar soft delete en todas las tablas que contienen datos históricos o que son referenciadas por ventas pasadas. El delete físico está prohibido en estas tablas para no perder historial de ventas, stock y movimientos.

## Regla General
Nunca usar `DELETE` en tablas históricas. En su lugar usar `is_active = false`.

---

## 1. Modificar tablas con soft delete

Agregar columna `is_active BOOLEAN DEFAULT true` a las siguientes tablas:

```sql
ALTER TABLE branches         ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE products         ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE product_variants ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE ingredients      ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE promotions       ADD COLUMN is_active BOOLEAN DEFAULT true;
```

---

## 2. Comportamiento esperado por tabla

### branches
- Al desactivar una sucursal (`is_active = false`):
  - No aparece en el POS ni en ningún selector
  - Todo su historial de ventas, stock y movimientos se conserva
  - Los reportes históricos siguen funcionando
  - El sistema debe verificar si hay cajeros asignados a esa sucursal y mostrar un aviso al admin: *"Hay X cajero(s) asignados a esta sucursal. Desactívalos o reasígnalos antes de continuar."*
  - No se puede desactivar la sucursal si tiene cajeros activos asignados

### products
- Al desactivar un producto (`is_active = false`):
  - No aparece en el POS ni en el menú del display
  - Sus ventas históricas en `order_items` se conservan intactas
  - Sus variantes deben desactivarse automáticamente en cascada

### product_variants
- Al desactivar una variante (`is_active = false`):
  - No aparece en el POS
  - Si todas las variantes de un producto están inactivas, el producto se considera inactivo también

### ingredients
- Al desactivar un insumo (`is_active = false`):
  - No aparece en el formulario de registro de compras de stock
  - Sus movimientos históricos en `stock_movements` se conservan
  - Si está siendo usado en alguna receta activa, mostrar aviso al admin antes de desactivar

### promotions
- Al desactivar una promoción (`is_active = false`):
  - No se aplica en el POS
  - El historial de descuentos aplicados en `order_items` se conserva

---

## 3. Filtros en queries

Todas las consultas deben filtrar por `is_active = true` por defecto en:
- Listado de productos en el POS
- Listado de productos en el admin (con opción de ver inactivos)
- Listado de sucursales en selectores
- Listado de insumos en formulario de compras y recetas
- Listado de promociones al calcular descuentos en el POS

Ejemplo:
```typescript
// Correcto
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)

// Incorrecto — nunca hacer esto en tablas históricas
await supabase.from('products').delete().eq('id', id)
```

---

## 4. Tablas que SÍ permiten delete físico

Estas tablas son solo configuración y no afectan el historial:

| Tabla | Razón |
|---|---|
| `recipes` | Configuración de receta, no referenciada en historial de ventas |
| `branch_prices` | Configuración de precios, se puede sobrescribir |
| `promotion_rules` | Configuración interna de la promo |

---

## 5. UI en el panel admin

- El botón de eliminar en las tablas históricas debe llamarse **"Desactivar"**, no "Eliminar"
- Las filas inactivas deben mostrarse con estilo visual diferente (gris, tachado) cuando el admin activa el filtro "Ver inactivos"
- Agregar opción **"Reactivar"** para poder volver a activar un registro desactivado
- En el caso de `branches`, mostrar modal de confirmación con la lista de cajeros afectados antes de desactivar

---

## Criterios de Aceptación

- [x] Columna `is_active` agregada en todas las tablas indicadas
- [x] Ninguna query de listado retorna registros con `is_active = false` salvo que se pida explícitamente
- [x] El botón de la UI dice "Desactivar" y no "Eliminar" en tablas históricas
- [x] Al desactivar una sucursal con cajeros activos, el sistema bloquea la acción y muestra aviso
- [x] Al desactivar un producto, sus variantes se desactivan en cascada
- [x] Los reportes históricos siguen mostrando datos de sucursales y productos desactivados
- [x] Existe opción "Reactivar" en el panel admin para todas las entidades con soft delete

---

## Estado: ✅ Completado