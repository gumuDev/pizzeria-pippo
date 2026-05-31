-- Migración 026: Tabla businesses + business_id en profiles y app_settings

-- 1. Tabla businesses
CREATE TABLE public.businesses (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT businesses_pkey PRIMARY KEY (id)
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_businesses" ON public.businesses
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "authenticated_read_businesses" ON public.businesses
  FOR SELECT TO authenticated USING (true);

-- 2. Agregar business_id a profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);

-- 3. Agregar business_id a app_settings
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);

-- Quitar el unique constraint actual en key (si existe) y reemplazarlo
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_key_key;
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_pkey;

-- Nuevo unique: (business_id, key) — permite la misma key para distintos negocios
ALTER TABLE public.app_settings
  ADD CONSTRAINT app_settings_business_key_unique UNIQUE (business_id, key);

-- NOTA: Los registros actuales en app_settings tienen business_id = NULL.
-- Crear el negocio inicial y asignarlo manualmente:
--
-- 1. Insertar el negocio:
--    INSERT INTO public.businesses (id, name) VALUES (gen_random_uuid(), 'Mi Negocio');
--
-- 2. Copiar el id generado y usarlo en los siguientes pasos:
--    UPDATE public.app_settings SET business_id = '<id>' WHERE business_id IS NULL;
--    UPDATE public.profiles SET business_id = '<id>' WHERE business_id IS NULL;
