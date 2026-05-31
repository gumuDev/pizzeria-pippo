-- Migración 028: Flag allow_mixing en product_categories
-- Reemplaza el hardcodeo category === 'pizza' para la función de producto mixto.
-- Solo las categorías con allow_mixing = true habilitan la selección de sabores en el POS.

ALTER TABLE public.product_categories
  ADD COLUMN IF NOT EXISTS allow_mixing boolean NOT NULL DEFAULT false;

-- La categoría pizza existente habilita mixing por defecto
UPDATE public.product_categories SET allow_mixing = true WHERE name = 'pizza';
