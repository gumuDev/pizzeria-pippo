-- 020 — Agregar columna product_type a products
-- Distingue productos elaborados (con receta) de productos de reventa (sin receta, stock directo)
-- Aplicar en Supabase SQL Editor como supabase_admin

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'made'
  CHECK (product_type IN ('made', 'resale'));

-- Marcar automáticamente como 'resale' los productos que ya no tienen ninguna receta
-- (ninguna variante tiene receta → producto de reventa)
UPDATE public.products p
SET product_type = 'resale'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.product_variants pv
  JOIN public.recipes r ON r.variant_id = pv.id
  WHERE pv.product_id = p.id
);
