-- ============================================================
-- 007_add_warehouse.sql
-- Bodega Central: warehouse_stock, warehouse_movements,
-- y campo origin en stock_movements
-- ============================================================

-- 1. Stock de la bodega central
CREATE TABLE public.warehouse_stock (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity numeric NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT warehouse_stock_pkey PRIMARY KEY (id),
  CONSTRAINT warehouse_stock_ingredient_id_fkey
    FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT warehouse_stock_ingredient_unique UNIQUE (ingredient_id)
);

-- 2. Movimientos de bodega
--    type en español para consistencia con stock_movements existente
CREATE TABLE public.warehouse_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL,
  quantity numeric NOT NULL,
  type text NOT NULL CHECK (type = ANY (
    ARRAY['compra'::text, 'transferencia'::text, 'ajuste'::text]
  )),
  -- branch_id solo se llena cuando type = 'transferencia'
  branch_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT warehouse_movements_pkey PRIMARY KEY (id),
  CONSTRAINT warehouse_movements_ingredient_fkey
    FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT warehouse_movements_branch_fkey
    FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT warehouse_movements_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- 3. Agregar origin a stock_movements existente
--    para saber si el movimiento de la sucursal vino de bodega, venta o ajuste
ALTER TABLE public.stock_movements
  ADD COLUMN origin text CHECK (origin = ANY (
    ARRAY['transferencia'::text, 'venta'::text, 'ajuste'::text]
  ));

-- 4. Migrar registros existentes
--    los movimientos anteriores tipo 'compra' directa → los marcamos como 'transferencia'
--    los de tipo 'venta' y 'ajuste' se mapean directo
UPDATE public.stock_movements
  SET origin = CASE
    WHEN type = 'compra'  THEN 'transferencia'
    WHEN type = 'venta'   THEN 'venta'
    WHEN type = 'ajuste'  THEN 'ajuste'
  END
WHERE origin IS NULL;

-- 5. Índice para acelerar historial de movimientos de bodega
CREATE INDEX idx_warehouse_movements_ingredient
  ON public.warehouse_movements (ingredient_id, created_at);

-- 6. Insertar filas en warehouse_stock para todos los insumos activos
--    (quantity = 0, min_quantity = 0 como punto de partida)
INSERT INTO public.warehouse_stock (ingredient_id, quantity, min_quantity)
SELECT id, 0, 0
FROM public.ingredients
WHERE is_active = true
ON CONFLICT (ingredient_id) DO NOTHING;
