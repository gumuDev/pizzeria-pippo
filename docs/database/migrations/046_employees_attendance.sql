-- ============================================================
-- 046_employees_attendance.sql
-- Feature: fichaje de empleados con credencial QR.
--
-- `employees` es un concepto nuevo, separado de `profiles` (que es
-- solo para gente que loguea al sistema: admin/cajero/cocinero) —
-- cubre cualquier personal (ayudante de cocina, delivery, limpieza)
-- con o sin cuenta de sistema. Cada empleado tiene una credencial de
-- dos partes: un token largo (va en la URL del QR) y un código corto
-- de respaldo para tipear a mano — de ambos solo se guarda el hash,
-- igual que `devices.api_key_hash`.
--
-- Sin RLS: igual que `devices` (038), estas tablas solo se acceden
-- desde el backend NestJS vía Prisma, nunca desde Supabase-JS/cliente
-- directo.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id        UUID NOT NULL REFERENCES public.branches(id),
  full_name        TEXT NOT NULL,
  position         TEXT NOT NULL,
  credential_hash  TEXT NOT NULL,
  manual_code_hash TEXT NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employees_branch_id_idx ON public.employees(branch_id);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES public.employees(id),
  branch_id    UUID NOT NULL REFERENCES public.branches(id),
  type         TEXT NOT NULL CHECK (type = ANY (ARRAY['entrada'::text, 'salida'::text])),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attendance_records_employee_created_idx ON public.attendance_records(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS attendance_records_branch_created_idx ON public.attendance_records(branch_id, created_at);

-- Horario de entrada por sucursal — solo informativo, se muestra junto
-- al historial de asistencia, no se compara contra la hora real ni
-- marca tardanzas.
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS expected_start_time TEXT;
