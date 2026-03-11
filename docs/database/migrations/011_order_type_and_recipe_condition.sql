-- 011_order_type_and_recipe_condition.sql
-- Agrega tipo de pedido a orders y condición de descuento a recipes
-- Módulo 14: Descuento condicional de insumos según tipo de pedido

-- 1. Tipo de pedido en orders
--    NOT NULL: es obligatorio seleccionarlo en el POS
--    DEFAULT 'dine_in': los registros históricos quedan como comer aquí
ALTER TABLE public.orders
  ADD COLUMN order_type text NOT NULL DEFAULT 'dine_in'
  CHECK (order_type = ANY (ARRAY['dine_in'::text, 'takeaway'::text]));

-- 2. Condición de aplicación en recipes
--    always   → se descuenta siempre (ingredientes base del producto)
--    takeaway → se descuenta solo si order_type = 'takeaway'
--    dine_in  → se descuenta solo si order_type = 'dine_in'
--    DEFAULT 'always': las recetas existentes no cambian de comportamiento
ALTER TABLE public.recipes
  ADD COLUMN apply_condition text NOT NULL DEFAULT 'always'
  CHECK (apply_condition = ANY (ARRAY['always'::text, 'takeaway'::text, 'dine_in'::text]));
