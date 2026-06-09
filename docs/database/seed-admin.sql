-- ============================================================
-- seed-admin.sql
-- Crea un usuario admin para desarrollo local con Docker Compose.
-- Ejecutar en el SQL Editor de Supabase Studio (http://localhost:54323)
-- SOLO para entorno local — nunca en producción.
--
-- Credenciales creadas:
--   Email:    admin@pippo.local
--   Password: admin1234
--
-- IMPORTANTE — RLS en profiles:
--   La tabla profiles debe tener una política RLS que permita a cada
--   usuario leer su propio perfil. Sin esto el login falla silenciosamente:
--   auth.signInWithPassword() retorna 200 OK pero getIdentity() retorna null
--   porque el SELECT a profiles es bloqueado por RLS, y Refine interpreta
--   getIdentity=null como "no autenticado" y redirige al login.
--
--   El paso 0 de este seed asegura que esa política exista.
-- ============================================================

-- 0. RLS en profiles — política para que cada usuario lea su propio perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 1. Crear el usuario en auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@pippo.local',
  -- bcrypt hash de "admin1234"
  crypt('admin1234', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear el perfil en public.profiles
INSERT INTO public.profiles (id, role, branch_id, full_name, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin',
  NULL,    -- admin no tiene sucursal fija
  'Administrador',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- OPCIONAL: crear una sucursal de prueba y un cajero
-- Descomentar si querés probar el POS también.
-- ============================================================

-- INSERT INTO public.branches (id, name, address)
-- VALUES
--   ('b0000000-0000-0000-0000-000000000001', 'Sucursal A', 'Av. Principal 123'),
--   ('b0000000-0000-0000-0000-000000000002', 'Sucursal B', 'Calle Secundaria 456')
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO auth.users (
--   id, instance_id, aud, role, email, encrypted_password,
--   email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
--   created_at, updated_at, confirmation_token, recovery_token,
--   email_change_token_new, email_change
-- ) VALUES (
--   'a0000000-0000-0000-0000-000000000002',
--   '00000000-0000-0000-0000-000000000000',
--   'authenticated', 'authenticated',
--   'cajero@pippo.local',
--   crypt('cajero1234', gen_salt('bf')),
--   now(),
--   '{"provider": "email", "providers": ["email"]}', '{}',
--   now(), now(), '', '', '', ''
-- ) ON CONFLICT (id) DO NOTHING;

-- INSERT INTO public.profiles (id, role, branch_id, full_name)
-- VALUES (
--   'a0000000-0000-0000-0000-000000000002',
--   'cajero',
--   'b0000000-0000-0000-0000-000000000001',
--   'Cajero Sucursal A'
-- ) ON CONFLICT (id) DO NOTHING;
