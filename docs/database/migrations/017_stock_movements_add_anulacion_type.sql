-- Add 'anulacion' as a valid type in stock_movements
-- Required to record stock reversals when an order is cancelled.

ALTER TABLE public.stock_movements
  DROP CONSTRAINT IF EXISTS stock_movements_type_check;

ALTER TABLE public.stock_movements
  ADD CONSTRAINT stock_movements_type_check
    CHECK (type = ANY (ARRAY['compra'::text, 'venta'::text, 'ajuste'::text, 'anulacion'::text]));
