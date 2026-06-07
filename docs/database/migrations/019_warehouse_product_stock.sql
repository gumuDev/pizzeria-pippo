-- ============================================================
-- 019_warehouse_product_stock.sql
-- Stock de productos de reventa en bodega central.
-- Aplica DESPUÉS de 018_branch_product_stock.sql
-- ============================================================

-- 1. Stock de productos de reventa en bodega
CREATE TABLE public.warehouse_product_stock (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  variant_id   uuid        NOT NULL,
  quantity     numeric     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity numeric     NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  updated_at   timestamptz DEFAULT now(),
  CONSTRAINT warehouse_product_stock_pkey PRIMARY KEY (id),
  CONSTRAINT warehouse_product_stock_variant_fkey
    FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT warehouse_product_stock_unique UNIQUE (variant_id)
);

-- 2. Movimientos de productos de reventa en bodega
CREATE TABLE public.warehouse_product_movements (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  variant_id   uuid        NOT NULL,
  quantity     numeric     NOT NULL,
  type         text        NOT NULL CHECK (type = ANY (
                 ARRAY['compra'::text, 'transferencia'::text, 'ajuste'::text]
               )),
  branch_id    uuid,
  notes        text,
  created_by   uuid,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT warehouse_product_movements_pkey PRIMARY KEY (id),
  CONSTRAINT warehouse_product_movements_variant_fkey
    FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT warehouse_product_movements_branch_fkey
    FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT warehouse_product_movements_user_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE INDEX idx_warehouse_product_movements_variant
  ON public.warehouse_product_movements (variant_id, created_at);

-- 3. RLS — warehouse_product_stock
ALTER TABLE public.warehouse_product_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read warehouse_product_stock"
  ON public.warehouse_product_stock FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert warehouse_product_stock"
  ON public.warehouse_product_stock FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update warehouse_product_stock"
  ON public.warehouse_product_stock FOR UPDATE
  TO authenticated USING (true);

-- 4. RLS — warehouse_product_movements
ALTER TABLE public.warehouse_product_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read warehouse_product_movements"
  ON public.warehouse_product_movements FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert warehouse_product_movements"
  ON public.warehouse_product_movements FOR INSERT
  TO authenticated WITH CHECK (true);
