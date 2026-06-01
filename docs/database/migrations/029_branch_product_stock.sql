-- ============================================================
-- 029_branch_product_stock.sql
-- Stock de productos de reventa por sucursal.
-- Aplica para productos con track_stock = true y sin receta.
--
-- Aplicar DESPUÉS de 028_category_allow_mixing.sql
-- ============================================================

-- 1. Stock de productos de reventa por sucursal
CREATE TABLE public.branch_product_stock (
  id           uuid      NOT NULL DEFAULT gen_random_uuid(),
  branch_id    uuid      NOT NULL,
  variant_id   uuid      NOT NULL,
  quantity     numeric   NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity numeric   NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  updated_at   timestamptz DEFAULT now(),
  CONSTRAINT branch_product_stock_pkey PRIMARY KEY (id),
  CONSTRAINT branch_product_stock_branch_fkey
    FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT branch_product_stock_variant_fkey
    FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT branch_product_stock_unique UNIQUE (branch_id, variant_id)
);

-- 2. Movimientos de stock de productos de reventa
CREATE TABLE public.product_stock_movements (
  id           uuid      NOT NULL DEFAULT gen_random_uuid(),
  branch_id    uuid      NOT NULL,
  variant_id   uuid      NOT NULL,
  quantity     numeric   NOT NULL,
  type         text      NOT NULL CHECK (type = ANY (
                 ARRAY['compra'::text, 'venta'::text, 'ajuste'::text, 'anulacion'::text]
               )),
  notes        text,
  created_by   uuid,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT product_stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT product_stock_movements_branch_fkey
    FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT product_stock_movements_variant_fkey
    FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT product_stock_movements_user_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE INDEX idx_product_stock_movements_branch_variant
  ON public.product_stock_movements (branch_id, variant_id, created_at);

-- 3. RLS — branch_product_stock
ALTER TABLE public.branch_product_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read branch_product_stock"
  ON public.branch_product_stock FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert branch_product_stock"
  ON public.branch_product_stock FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update branch_product_stock"
  ON public.branch_product_stock FOR UPDATE
  TO authenticated USING (true);

-- 4. RLS — product_stock_movements
ALTER TABLE public.product_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read product_stock_movements"
  ON public.product_stock_movements FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert product_stock_movements"
  ON public.product_stock_movements FOR INSERT
  TO authenticated WITH CHECK (true);
