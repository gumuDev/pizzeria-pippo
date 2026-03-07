-- ============================================================
-- 002_soft_delete.sql
-- Agrega columna is_active para soft delete en tablas principales.
-- ============================================================

ALTER TABLE branches        ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE ingredients     ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE products        ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE promotions      ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Sincronizar registros existentes
UPDATE branches         SET is_active = true WHERE is_active IS NULL;
UPDATE ingredients      SET is_active = true WHERE is_active IS NULL;
UPDATE products         SET is_active = true WHERE is_active IS NULL;
UPDATE product_variants SET is_active = true WHERE is_active IS NULL;
UPDATE promotions       SET is_active = true WHERE is_active IS NULL;
