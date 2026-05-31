-- Migración 023: Configuración del negocio (business config)
-- Crear bucket "business-assets" en Supabase Storage para alojar el logo del negocio.
-- Las claves de configuración se almacenan en la tabla app_settings existente.
-- No requiere nuevas tablas.

-- Insertar valores por defecto en app_settings (si no existen)
INSERT INTO app_settings (key, value, updated_at)
VALUES
  ('business_name', '', NOW()),
  ('business_type', 'other', NOW()),
  ('business_logo_url', '', NOW()),
  ('business_primary_color', '#f97316', NOW())
ON CONFLICT (key) DO NOTHING;

-- NOTA MANUAL: Crear el bucket "business-assets" en Supabase Storage Dashboard:
-- Storage > New bucket > Name: "business-assets" > Public: true
-- Policy sugerida para el bucket (ejecutar en SQL Editor):
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('business-assets', 'business-assets', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "Admin can upload business assets"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'business-assets'
--   AND auth.role() = 'authenticated'
-- );
--
-- CREATE POLICY "Public can read business assets"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'business-assets');
