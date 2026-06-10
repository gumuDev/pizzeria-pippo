# Migraciones Pendientes — Ejecutar en Supabase

> Aplicar **en orden** en el SQL Editor de Supabase.
> Ir a: **Supabase Dashboard → SQL Editor → New query → pegar el contenido → Run**

---

## Pendientes de aplicar

| # | Archivo | Qué hace | Depende de |
|---|---------|----------|------------|
| 1 | `033_create_order_atomic.sql` | Función transaccional `create_order_atomic`: orden + items + sabores + stock en una sola transacción, con lock para el `daily_number`. **Requerida ANTES del deploy del refactor de `/api/orders`** | `028`, `029`, `030` (ya aplicadas) |

## Aplicadas en producción

> Confirmado el 2026-06-10: las migraciones `023`–`032` ya están aplicadas en producción
> (028–032 confirmadas por Luis; 023–027 verificadas contra `schema-production.sql` del 2026-06-07).

| # | Archivo | Qué hace |
|---|---------|----------|
| ✅ | `023_fix_variant_size_check.sql` | Elimina CHECK constraint de `variant_size` en `promotion_rules` que bloqueaba tamaños personalizados |
| ✅ | `024_app_settings.sql` | Crea tabla `app_settings` con RLS + filas iniciales de Telegram |
| ✅ | `025_telegram_ai_bot.sql` | Crea tablas `telegram_authorized_chats` y `telegram_usage` + nuevas keys en `app_settings` |
| ✅ | `026_orders_idempotency_key.sql` | Agrega columna `idempotency_key` a `orders` + índice unique |
| ✅ | `027_kitchen_late_threshold.sql` | Inserta key `kitchen_late_threshold_minutes` en `app_settings` |
| ✅ | `028_branch_product_stock.sql` | Crea tablas `branch_product_stock` y `product_stock_movements` con RLS |
| ✅ | `029_warehouse_product_stock.sql` | Crea tablas `warehouse_product_stock` y `warehouse_product_movements` con RLS |
| ✅ | `030_add_product_type.sql` | Agrega columna `product_type` a `products` (`made` / `resale`) |
| ✅ | `031_fix_product_type_reset.sql` | Resetea todos los `product_type` a `made` para asignación manual |
| ✅ | `032_fix_rls_security_warnings.sql` | Elimina políticas inseguras con `user_metadata`; estabiliza todas las llamadas a `auth.uid()` y `get_user_role()` con `(select ...)` |

---

## Scripts paso a paso

### 1 — `023_fix_variant_size_check.sql`
```sql
ALTER TABLE public.promotion_rules
  DROP CONSTRAINT IF EXISTS promotion_rules_variant_size_check;
```
**Verificar:** Crear una promoción con tamaño personalizado (ej. "Grande") sin error.

---

### 2 — `024_app_settings.sql`
```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings (key, value) VALUES
  ('telegram_bot_token', ''),
  ('telegram_chat_id',   ''),
  ('telegram_enabled',   'false')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_app_settings"
  ON app_settings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "admin_insert_app_settings"
  ON app_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "admin_update_app_settings"
  ON app_settings FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
```
**Verificar:** Ir a `/settings` en el admin — debe cargar sin Error 500.

---

### 3 — `025_telegram_ai_bot.sql`
> Requiere que `024` ya esté aplicado.

Pegar contenido completo de `025_telegram_ai_bot.sql`.

**Verificar:** En Supabase Table Editor deben existir `telegram_authorized_chats` y `telegram_usage`.

---

### 4 — `026_orders_idempotency_key.sql`
```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique
  ON orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
```
**Verificar:** En el POS, confirmar una venta — no debe aparecer el error `Could not find the 'idempotency_key' column`.

---

### 5 — `027_kitchen_late_threshold.sql`
> Requiere que `024` ya esté aplicado.

```sql
INSERT INTO app_settings (key, value, updated_at)
VALUES ('kitchen_late_threshold_minutes', '10', now())
ON CONFLICT (key) DO NOTHING;
```
**Verificar:** En `/settings`, el campo "Tiempo límite cocina" debe mostrar 10 minutos por defecto.

---

### 6 — `028_branch_product_stock.sql`
> Tabla de stock de productos de reventa por sucursal.

Pegar contenido completo de `028_branch_product_stock.sql`.

**Verificar:** En Supabase Table Editor deben existir `branch_product_stock` y `product_stock_movements`.

---

### 7 — `029_warehouse_product_stock.sql`
> Requiere que `028` ya esté aplicado.

Pegar contenido completo de `029_warehouse_product_stock.sql`.

**Verificar:** En Supabase Table Editor deben existir `warehouse_product_stock` y `warehouse_product_movements`.

---

### 8 — `030_add_product_type.sql`
```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'made'
  CHECK (product_type IN ('made', 'resale'));
```
> **No ejecutar el UPDATE automático** — pasar directo a la migración 031.

**Verificar:** La columna `product_type` existe en la tabla `products` con default `made`.

---

### 9 — `031_fix_product_type_reset.sql`
```sql
UPDATE public.products SET product_type = 'made';
```
**Verificar:** Todos los productos tienen `product_type = 'made'`. Luego asignar `resale` manualmente desde el formulario de edición de cada producto.

---

### 10 — `032_fix_rls_security_warnings.sql`

Pegar el contenido completo del archivo.

**Qué hace:**
- **Parte 1:** Elimina las políticas de `variant_types` que usaban `auth.jwt()->'user_metadata'` (inseguro — editable por el usuario final). Las políticas correctas ya existen (`variant_types_admin_*`).
- **Partes 2–8:** Reemplaza todas las llamadas directas a `auth.uid()`, `get_user_role()`, `get_user_branch_id()` y los `EXISTS(...)` por `(select ...)` para que Postgres las evalúe **una sola vez por query** en vez de una vez por fila.

**Verificar:** En Supabase → Database → Security Advisor — las advertencias deben desaparecer. Probar que admin/cajero/cocinero siguen funcionando normalmente.

---

## Notas importantes

- **No saltar pasos.** Las migraciones 025, 027 dependen de que la tabla `app_settings` (024) exista primero.
- **029 depende de 028.** La FK de `warehouse_product_movements.branch_id` referencia `branches`, pero la FK de `variant_id` referencia `product_variants` que debe estar creada en 028.
- **030 + 031 van juntas.** La 030 agrega la columna, la 031 la resetea. Ejecutar ambas en la misma sesión.
- Después de aplicar todas las migraciones, actualizar `docs/database/schema-base.sql` con el export actual desde Supabase.
