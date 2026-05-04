-- 013_pizza_flavors.sql
-- Tabla satélite de order_items para pizzas con dos sabores (mitad/mitad).
-- Solo existe un registro aquí cuando el ítem es una pizza mixta.
-- Cada pizza mixta genera DOS filas: una por cada sabor con proportion = 0.50.

CREATE TABLE public.order_item_flavors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL,
  variant_id uuid NOT NULL,
  proportion numeric NOT NULL DEFAULT 0.50 CHECK (proportion > 0 AND proportion <= 1),
  CONSTRAINT order_item_flavors_pkey PRIMARY KEY (id),
  CONSTRAINT order_item_flavors_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE,
  CONSTRAINT order_item_flavors_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);

-- RLS
ALTER TABLE public.order_item_flavors ENABLE ROW LEVEL SECURITY;

-- Lectura: usuarios autenticados pueden leer (cajeros, cocineros, admin)
CREATE POLICY "order_item_flavors_select" ON public.order_item_flavors
  FOR SELECT TO authenticated USING (true);

-- Insertar: solo usuarios autenticados (el backend usa service role, pero por completitud)
CREATE POLICY "order_item_flavors_insert" ON public.order_item_flavors
  FOR INSERT TO authenticated WITH CHECK (true);

-- Grants necesarios para que Supabase pueda operar sobre la tabla
GRANT ALL ON public.order_item_flavors TO anon;
GRANT ALL ON public.order_item_flavors TO authenticated;
GRANT ALL ON public.order_item_flavors TO service_role;
