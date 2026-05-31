-- Migración 027: Flag track_stock en products
-- Si track_stock = false, el sistema no descuenta stock al vender ese producto.
-- Productos existentes quedan con track_stock = true (comportamiento anterior).

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS track_stock boolean NOT NULL DEFAULT true;
