-- ============================================================
-- 045_fix_product_stock_movements_user_fkey.sql
-- `product_stock_movements.created_by` y `warehouse_product_movements.created_by`
-- todavía referenciaban `auth.users(id)`, un resabio de antes de la
-- migración a NestJS. El resto de las tablas equivalentes
-- (orders.cashier_id, orders.cancelled_by, stock_movements.created_by,
-- warehouse_movements.created_by) ya fueron repuntadas a `profiles(id)`
-- en su momento — estas dos (agregadas después, en el módulo de Bodega
-- Central / reventa) quedaron afuera.
--
-- Efecto del bug: cualquier cajero cuyo `profiles.id` no tuviera una fila
-- espejo en `auth.users` (ya no es requisito desde que el login dejó de
-- depender de Supabase Auth) rompía con un foreign key violation al
-- confirmar una venta que descuenta stock de un producto de reventa.
-- ============================================================

ALTER TABLE public.product_stock_movements
  DROP CONSTRAINT product_stock_movements_user_fkey;
ALTER TABLE public.product_stock_movements
  ADD CONSTRAINT product_stock_movements_user_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE public.warehouse_product_movements
  DROP CONSTRAINT warehouse_product_movements_user_fkey;
ALTER TABLE public.warehouse_product_movements
  ADD CONSTRAINT warehouse_product_movements_user_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id);
