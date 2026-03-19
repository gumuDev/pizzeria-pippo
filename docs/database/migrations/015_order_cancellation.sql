-- 015_order_cancellation.sql
-- Agrega soporte para anulación de órdenes con restauración automática de stock.
-- Aplicar en Supabase SQL Editor, luego actualizar schema-base.sql.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at  timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cancelled_by  uuid        DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancel_reason text        DEFAULT NULL;

-- Índice parcial: acelera consultas de órdenes activas (no anuladas)
CREATE INDEX IF NOT EXISTS orders_cancelled_at_idx ON public.orders (cancelled_at)
  WHERE cancelled_at IS NULL;
