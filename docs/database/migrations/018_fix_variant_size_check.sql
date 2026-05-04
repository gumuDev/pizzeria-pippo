-- 018_fix_variant_size_check.sql
-- El constraint original en promotion_rules limitaba variant_size a
-- ('Personal', 'Mediana', 'Familiar'), bloqueando cualquier tamaño personalizado.
-- Se elimina el CHECK para que acepte cualquier string libre, igual que lo hace
-- product_variants.name en la BD.

ALTER TABLE public.promotion_rules
  DROP CONSTRAINT IF EXISTS promotion_rules_variant_size_check;
