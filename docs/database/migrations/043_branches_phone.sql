-- 043_branches_phone.sql
-- Agrega el teléfono de contacto de cada sucursal — se usa en el admin
-- para gestión interna y en el landing público para los botones de
-- WhatsApp (general y por sucursal en la sección de Ubicación).

ALTER TABLE public.branches ADD COLUMN phone text;
