-- Migración 025: Simplificar product_categories — quitar emoji, color, sort_order
-- La tabla solo necesita id, name, is_active, created_at.

ALTER TABLE public.product_categories DROP COLUMN IF EXISTS emoji;
ALTER TABLE public.product_categories DROP COLUMN IF EXISTS color;
ALTER TABLE public.product_categories DROP COLUMN IF EXISTS sort_order;
