-- ============================================================
-- 040_businesses_backfill.sql
-- Backfill que faltaba en 034_businesses_multitenant.sql: esa
-- migración crea la tabla `businesses` y las columnas `business_id`,
-- pero no inserta ningún negocio ni completa los valores existentes.
--
-- Confirmado el 2026-07-15 contra el dump de producción del 2026-07-14:
-- la tabla `businesses` no existe y `profiles`/`app_settings` no
-- tienen `business_id` — la migración 034 nunca se aplicó realmente
-- en producción pese a lo que decía su comentario.
--
-- Requiere 034 ya aplicada antes de correr esto.
-- ============================================================

INSERT INTO public.businesses (name, is_active)
SELECT 'Pizzería Pippo', true
WHERE NOT EXISTS (SELECT 1 FROM public.businesses);

UPDATE public.profiles
SET business_id = (SELECT id FROM public.businesses LIMIT 1)
WHERE business_id IS NULL;

UPDATE public.app_settings
SET business_id = (SELECT id FROM public.businesses LIMIT 1)
WHERE business_id IS NULL;

-- Verificación manual — debe devolver 0 filas:
-- SELECT id FROM public.profiles WHERE business_id IS NULL;
-- SELECT key FROM public.app_settings WHERE business_id IS NULL;
