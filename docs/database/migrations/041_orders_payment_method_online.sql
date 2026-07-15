-- ============================================================
-- 041_orders_payment_method_online.sql
-- Agrega "online" como valor válido de payment_method en orders,
-- para pedidos ya pagados por fuera del POS (sin pasar por la
-- validación automática de QR/Yape).
-- ============================================================

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method = ANY (ARRAY['efectivo'::text, 'qr'::text, 'online'::text]));
