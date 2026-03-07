-- ============================================================
-- 004_orders_kitchen_status.sql
-- Agrega kitchen_status a orders para el módulo KDS (Kitchen Display System).
-- Valores: 'pending' (default) | 'ready'
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS kitchen_status varchar(20) DEFAULT 'pending';

-- Marcar órdenes existentes como ready para no contaminar la pantalla de cocina
UPDATE orders SET kitchen_status = 'ready' WHERE kitchen_status IS NULL;

-- Activar Realtime en la tabla orders (ejecutar en Supabase dashboard →
-- Database → Replication → orders, o via CLI: supabase db push)
-- alter publication supabase_realtime add table orders;
