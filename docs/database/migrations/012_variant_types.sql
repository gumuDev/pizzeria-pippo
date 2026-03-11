-- 012_variant_types.sql
-- Reemplaza los tipos de variante hardcodeados por una tabla configurable
-- Módulo 15: Tipos de Variante Dinámicos

-- 1. Nueva tabla de tipos de variante
CREATE TABLE public.variant_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT variant_types_pkey PRIMARY KEY (id),
  CONSTRAINT variant_types_name_unique UNIQUE (name)
);

-- 2. Seed: migrar los tres tipos actuales para mantener compatibilidad
INSERT INTO public.variant_types (name, sort_order) VALUES
  ('Personal',  1),
  ('Mediana',   2),
  ('Familiar',  3);

-- 3. Quitar el CHECK constraint de product_variants.name
--    Los registros existentes siguen siendo válidos (Personal/Mediana/Familiar ya están en seed)
ALTER TABLE public.product_variants
  DROP CONSTRAINT product_variants_name_check;
