-- ============================================================
-- 037_profiles_drop_auth_fks.sql
-- Fase 7 (migración NestJS) — paso 3 de 3. Punto sin retorno: requiere
-- que 036 haya sido verificada (0 filas con email/password_hash NULL)
-- antes de correr esto. A partir de acá `profiles` deja de depender
-- de `auth.users` para todo uso de la aplicación.
--
-- No se borra `auth.users` ni el schema `auth` en sí — solo se dejan
-- de referenciar desde las tablas de la app.
-- ============================================================

ALTER TABLE public.profiles
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN password_hash SET NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_cashier_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_cashier_id_fkey
  FOREIGN KEY (cashier_id) REFERENCES public.profiles(id);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_cancelled_by_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_cancelled_by_fkey
  FOREIGN KEY (cancelled_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_created_by_fkey;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE public.warehouse_movements DROP CONSTRAINT IF EXISTS warehouse_movements_created_by_fkey;
ALTER TABLE public.warehouse_movements ADD CONSTRAINT warehouse_movements_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id);
