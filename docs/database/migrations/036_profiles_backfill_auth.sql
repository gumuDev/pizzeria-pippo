-- ============================================================
-- 036_profiles_backfill_auth.sql
-- Fase 7 (migración NestJS) — paso 2 de 3. Copia email, hash de
-- contraseña (bcrypt, mismo algoritmo que usa Node) y estado de baneo
-- desde `auth.users` (Supabase) hacia `profiles`, para dejar de
-- depender de GoTrue como fuente de identidad.
--
-- Requiere 035 ya aplicada. Correr 037 (drop de FKs + NOT NULL) recién
-- después de confirmar que la query de verificación de abajo devuelve
-- 0 filas.
-- ============================================================

UPDATE public.profiles p
SET email = u.email,
    password_hash = u.encrypted_password,
    is_banned = (u.banned_until IS NOT NULL AND u.banned_until > now())
FROM auth.users u
WHERE p.id = u.id;

-- Verificación manual — debe devolver 0 filas antes de aplicar 037.
-- SELECT id FROM public.profiles WHERE email IS NULL OR password_hash IS NULL;
