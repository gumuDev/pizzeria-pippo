-- ============================================================
-- 009_add_payment_method_to_orders.sql
-- Agrega método de pago a la tabla orders
-- NULL = no especificado (campo opcional)
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN payment_method text CHECK (payment_method = ANY (
    ARRAY['efectivo'::text, 'qr'::text]
  ));
