-- ============================================================
-- 034_businesses_multitenant.sql
-- Documenta el soporte multi-tenant (tabla `businesses` + `business_id`)
-- que ya existe en la base de datos real pero no tenía migración
-- documentada en este directorio (la numeración fue reorganizada en algún
-- punto y el archivo original se perdió; origen: commit histórico 4ca1995
-- "multi-business adaptation").
--
-- -- Ya aplicado en Supabase el 2026-07-05 (fecha en que se encontró y
-- documentó el drift, no la fecha real de aplicación original, que se
-- desconoce).
--
-- Encontrado al migrar los módulos Usuarios y Configuración a NestJS:
-- `profiles`, `app_settings` y `products` tienen columna `business_id`
-- (FK a `businesses.id`) sin ningún rastro en las migraciones documentadas.
-- Esta migración solo cubre `businesses`, `profiles.business_id` y
-- `app_settings.business_id` (lo que tocan los módulos migrados hasta
-- ahora) — `products.business_id` queda pendiente de documentar cuando
-- se revise ese módulo.
-- ============================================================

CREATE TABLE public.businesses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT businesses_pkey PRIMARY KEY (id)
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_businesses" ON public.businesses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_businesses" ON public.businesses
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN business_id uuid REFERENCES public.businesses(id);

ALTER TABLE public.app_settings
  ADD COLUMN business_id uuid REFERENCES public.businesses(id);

-- El unique constraint real de app_settings ya es compuesto (business_id, key)
-- en vez de solo (key) — reflejado acá para que quede documentado.
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_pkey;
ALTER TABLE public.app_settings
  ADD CONSTRAINT app_settings_business_key_unique UNIQUE (business_id, key);
