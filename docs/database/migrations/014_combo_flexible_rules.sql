-- 014_combo_flexible_rules.sql
-- Agrega soporte para reglas de combo flexibles por categoría y tamaño de variante.
-- Permite configurar un slot de combo como "cualquier pizza Personal" en lugar de
-- una variante específica. Si category y variant_size son NULL, el comportamiento
-- es idéntico al anterior (match por variant_id exacto).

ALTER TABLE public.promotion_rules
  ADD COLUMN IF NOT EXISTS category text
    CHECK (category IS NULL OR category = ANY (ARRAY['pizza', 'bebida', 'otro'])),
  ADD COLUMN IF NOT EXISTS variant_size text
    CHECK (variant_size IS NULL OR variant_size = ANY (ARRAY['Personal', 'Mediana', 'Familiar']));
