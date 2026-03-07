-- 006_add_daily_number_to_orders.sql
-- Agrega número de orden diario por sucursal a la tabla orders.
-- El contador empieza en 1 cada día por sucursal y se muestra al cajero y al cocinero.

ALTER TABLE orders
  ADD COLUMN daily_number INTEGER NOT NULL DEFAULT 0;

-- Índice para acelerar la consulta del último número del día por sucursal
CREATE INDEX idx_orders_branch_date
  ON orders (branch_id, created_at);
