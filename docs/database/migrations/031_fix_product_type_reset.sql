-- 021 — Revertir product_type mal asignado por la migración 020
-- El UPDATE automático marcó como 'resale' productos que simplemente no tenían
-- recetas en el entorno local (datos importados incompletos), pero son productos
-- de elaboración propia. Se resetea todo a 'made' y el admin asigna manualmente.

UPDATE public.products SET product_type = 'made';
