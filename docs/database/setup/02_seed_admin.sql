-- ============================================================
-- 02_seed_admin.sql — Pizzería Pippo
-- Crea un usuario admin por defecto para entorno local/dev.
-- Aplicar DESPUÉS de 01_schema.sql.
--
-- Credenciales por defecto:
--   Email:    admin@pippo.com
--   Password: admin1234
--
-- IMPORTANTE: Cambiar la contraseña en producción.
-- ============================================================

-- Insertar usuario en auth.users directamente (bypass de email confirmation)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@pippo.com',
  crypt('admin1234', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Administrador"}',
  false,
  'authenticated',
  'authenticated'
)
ON CONFLICT (email) DO NOTHING;

-- Crear perfil admin vinculado al usuario recién creado
INSERT INTO public.profiles (id, full_name, role, branch_id)
SELECT
  id,
  'Administrador',
  'admin',
  NULL
FROM auth.users
WHERE email = 'admin@pippo.com'
ON CONFLICT (id) DO NOTHING;
