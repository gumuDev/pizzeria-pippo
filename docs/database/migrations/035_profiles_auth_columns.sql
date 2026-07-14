-- ============================================================
-- 035_profiles_auth_columns.sql
-- Fase 7 (migración NestJS) — paso 1 de 3 para que `profiles` sea la
-- única fuente de verdad de identidad, reemplazando a `auth.users` de
-- Supabase. Este archivo es aditivo y seguro de correr en cualquier
-- momento; el backfill real (036) y el drop de FKs (037) van aparte.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- Los índices únicos de Postgres permiten múltiples NULL, así que esto
-- puede crearse antes del backfill sin fallar.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique ON public.profiles (email);
