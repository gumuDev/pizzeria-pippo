-- Migración 024: Categorías de productos dinámicas
-- Reemplaza el enum hardcodeado ['pizza', 'bebida', 'otro'] por una tabla configurable.

-- 1. Nueva tabla de categorías
CREATE TABLE IF NOT EXISTS public.product_categories (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  emoji      text        NOT NULL DEFAULT '📦',
  color      text        NOT NULL DEFAULT 'default',
  sort_order integer     NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT product_categories_pkey        PRIMARY KEY (id),
  CONSTRAINT product_categories_name_unique UNIQUE (name)
);

-- RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_categories" ON public.product_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_categories" ON public.product_categories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. Quitar CHECK constraint fijo en products.category
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

-- 3. Quitar CHECK constraint fijo en promotion_rules.category
ALTER TABLE public.promotion_rules DROP CONSTRAINT IF EXISTS promotion_rules_category_check;

-- 4. Seed de categorías iniciales (las mismas que estaban hardcodeadas)
INSERT INTO public.product_categories (name, emoji, color, sort_order) VALUES
  ('pizza',  '🍕', 'red',     1),
  ('bebida', '🥤', 'blue',    2),
  ('otro',   '🍽️', 'default', 3)
ON CONFLICT (name) DO NOTHING;
