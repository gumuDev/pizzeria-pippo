-- ============================================================
-- 038_devices_table.sql
-- Feature: validación automática de pago QR (Yape) en el POS.
--
-- Tabla de dispositivos (celulares) autorizados a reportar pagos
-- detectados al backend. Cada dispositivo pertenece a una sola
-- sucursal y se autentica con un API key propio (solo se guarda
-- su hash, nunca el valor en texto plano).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID NOT NULL REFERENCES public.branches(id),
  name          TEXT NOT NULL,
  api_key_hash  TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS devices_branch_id_idx ON public.devices(branch_id);
