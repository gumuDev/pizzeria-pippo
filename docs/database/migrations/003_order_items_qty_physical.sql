-- ============================================================
-- 003_order_items_qty_physical.sql
-- Agrega qty_physical a order_items para separar unidades cobradas
-- de unidades físicas preparadas (necesario para BUY_X_GET_Y).
-- qty         = unidades cobradas al cliente
-- qty_physical = unidades que salen físicamente de la cocina
-- ============================================================

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS qty_physical integer NOT NULL DEFAULT 1;
