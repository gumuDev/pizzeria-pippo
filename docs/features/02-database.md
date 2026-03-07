# 02 — Base de Datos

## Objetivo
Crear todas las tablas en Supabase con sus relaciones, constraints y Row Level Security (RLS).

## Tareas

### Tablas principales
- [x] `branches` — sucursales (id, name, address)
- [x] `profiles` — perfil de usuario (id, role, branch_id, full_name)
- [x] `products` — productos (id, name, category, description, image_url)
- [x] `product_variants` — variantes (id, product_id, name, base_price)
- [x] `branch_prices` — precio por variante/sucursal (branch_id, variant_id, price)
- [x] `ingredients` — insumos (id, name, unit)
- [x] `branch_stock` — stock por sucursal (branch_id, ingredient_id, quantity, min_quantity)
- [x] `recipes` — receta por variante (variant_id, ingredient_id, quantity)
- [x] `stock_movements` — movimientos (id, branch_id, ingredient_id, quantity, type, created_at)
- [x] `promotions` — promociones (id, name, type, days_of_week, start_date, end_date, branch_id)
- [x] `promotion_rules` — reglas (promotion_id, variant_id, buy_qty, get_qty, discount_percent)
- [x] `orders` — ventas (id, branch_id, cashier_id, total, created_at)
- [x] `order_items` — detalle (order_id, variant_id, qty, unit_price, discount_applied)

### Relaciones y constraints
- [x] FK: `product_variants.product_id → products.id`
- [x] FK: `branch_prices.(branch_id, variant_id)` → tablas correspondientes
- [x] FK: `branch_stock.(branch_id, ingredient_id)`
- [x] FK: `recipes.(variant_id, ingredient_id)`
- [x] FK: `stock_movements.(branch_id, ingredient_id)`
- [x] FK: `promotion_rules.promotion_id → promotions.id`
- [x] FK: `orders.(branch_id, cashier_id)`
- [x] FK: `order_items.(order_id, variant_id)`
- [x] CHECK: `products.category IN ('pizza', 'bebida', 'otro')`
- [x] CHECK: `product_variants.name IN ('Personal', 'Mediana', 'Familiar')`
- [x] CHECK: `ingredients.unit IN ('g', 'kg', 'ml', 'l', 'unidad')`
- [x] CHECK: `stock_movements.type IN ('compra', 'venta', 'ajuste')`
- [x] CHECK: `promotions.type IN ('BUY_X_GET_Y', 'PERCENTAGE', 'COMBO')`

### Row Level Security (RLS)
- [x] Habilitar RLS en todas las tablas
- [x] Policy: cajero solo accede a datos de su sucursal asignada
- [x] Policy: admin accede a todas las sucursales
- [x] Policy: lectura de productos/variantes/recetas sin restricción (POS y display)
- [x] Tabla `profiles` con `branch_id` y `role` por usuario
- [x] Funciones helper: `get_user_role()` y `get_user_branch_id()`
- [x] Trigger `on_auth_user_created` — crea perfil automáticamente al registrar usuario

### Datos semilla (seed)
- [x] 2 sucursales: Sucursal A y Sucursal B
- [x] 7 ingredientes base (harina, tomate, mozzarella, pepperoni, jamón, coca-cola, agua)
- [x] 3 productos: Pizza Pepperoni, Pizza Jamón, Coca-Cola
- [x] Variantes y precios base para cada producto
- [x] Recetas internas para cada variante
- [x] Stock inicial para ambas sucursales con mínimos configurados

### Supabase Storage
- [x] Crear bucket `product-images` (público)

## Notas
- El schema está en `supabase/001_schema.sql`
- El trigger crea el perfil automáticamente con el `role` y `full_name` del metadata del usuario
- Los precios en la tabla `product_variants` son el precio base; `branch_prices` los sobreescribe por sucursal

## Resultado esperado ✅
Todas las tablas creadas con RLS activo. Datos semilla cargados. Storage configurado.
