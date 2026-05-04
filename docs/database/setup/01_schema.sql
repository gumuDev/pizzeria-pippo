-- ============================================================
-- 01_schema.sql — Pizzería Pippo
-- Schema completo y actualizado (incluye todas las migraciones 002–021)
-- Aplicar manualmente en Supabase SQL Editor en orden.
-- ============================================================


-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ------------------------------------------------------------
-- BRANCHES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  address    text,
  created_at timestamptz DEFAULT now(),
  is_active  boolean     DEFAULT true,
  CONSTRAINT branches_pkey PRIMARY KEY (id)
);


-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid        NOT NULL,
  role       text        NOT NULL CHECK (role = ANY (ARRAY['admin', 'cajero', 'cocinero'])),
  branch_id  uuid,
  full_name  text,
  created_at timestamptz DEFAULT now(),
  is_active  boolean     DEFAULT true,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey       FOREIGN KEY (id)        REFERENCES auth.users(id),
  CONSTRAINT profiles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);


-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  category    text        NOT NULL CHECK (category = ANY (ARRAY['pizza', 'bebida', 'otro'])),
  description text,
  image_url   text,
  created_at  timestamptz DEFAULT now(),
  is_active   boolean     DEFAULT true,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);


-- ------------------------------------------------------------
-- VARIANT TYPES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.variant_types (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  sort_order integer     NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT variant_types_pkey        PRIMARY KEY (id),
  CONSTRAINT variant_types_name_unique UNIQUE (name)
);


-- ------------------------------------------------------------
-- PRODUCT VARIANTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid        NOT NULL,
  name       text        NOT NULL,
  base_price numeric     NOT NULL CHECK (base_price >= 0),
  created_at timestamptz DEFAULT now(),
  is_active  boolean     DEFAULT true,
  CONSTRAINT product_variants_pkey       PRIMARY KEY (id),
  CONSTRAINT product_variants_product_fk FOREIGN KEY (product_id) REFERENCES public.products(id)
);


-- ------------------------------------------------------------
-- BRANCH PRICES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branch_prices (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  branch_id  uuid        NOT NULL,
  variant_id uuid        NOT NULL,
  price      numeric     NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT branch_prices_pkey       PRIMARY KEY (id),
  CONSTRAINT branch_prices_branch_fk  FOREIGN KEY (branch_id)  REFERENCES public.branches(id),
  CONSTRAINT branch_prices_variant_fk FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);


-- ------------------------------------------------------------
-- INGREDIENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ingredients (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  unit       text        NOT NULL CHECK (unit = ANY (ARRAY['g', 'kg', 'ml', 'l', 'unidad'])),
  created_at timestamptz DEFAULT now(),
  is_active  boolean     DEFAULT true,
  CONSTRAINT ingredients_pkey PRIMARY KEY (id)
);


-- ------------------------------------------------------------
-- BRANCH STOCK
-- (quantity permite negativos hasta -99999 — migración 016)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branch_stock (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  branch_id     uuid        NOT NULL,
  ingredient_id uuid        NOT NULL,
  quantity      numeric     NOT NULL DEFAULT 0 CHECK (quantity >= -99999),
  min_quantity  numeric     NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  updated_at    timestamptz DEFAULT now(),
  CONSTRAINT branch_stock_pkey          PRIMARY KEY (id),
  CONSTRAINT branch_stock_branch_fk     FOREIGN KEY (branch_id)     REFERENCES public.branches(id),
  CONSTRAINT branch_stock_ingredient_fk FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);


-- ------------------------------------------------------------
-- RECIPES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipes (
  id             uuid    NOT NULL DEFAULT gen_random_uuid(),
  variant_id     uuid    NOT NULL,
  ingredient_id  uuid    NOT NULL,
  quantity       numeric NOT NULL CHECK (quantity > 0),
  apply_condition text   NOT NULL DEFAULT 'always'
    CHECK (apply_condition = ANY (ARRAY['always', 'takeaway', 'dine_in'])),
  CONSTRAINT recipes_pkey          PRIMARY KEY (id),
  CONSTRAINT recipes_variant_fk    FOREIGN KEY (variant_id)    REFERENCES public.product_variants(id),
  CONSTRAINT recipes_ingredient_fk FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);


-- ------------------------------------------------------------
-- STOCK MOVEMENTS
-- (type incluye 'anulacion' — migración 017)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  branch_id     uuid        NOT NULL,
  ingredient_id uuid        NOT NULL,
  quantity      numeric     NOT NULL,
  type          text        NOT NULL
    CHECK (type = ANY (ARRAY['compra', 'venta', 'ajuste', 'anulacion'])),
  origin        text
    CHECK (origin IS NULL OR origin = ANY (ARRAY['transferencia', 'venta', 'ajuste'])),
  notes         text,
  created_by    uuid,
  created_at    timestamptz DEFAULT now(),
  CONSTRAINT stock_movements_pkey          PRIMARY KEY (id),
  CONSTRAINT stock_movements_branch_fk     FOREIGN KEY (branch_id)     REFERENCES public.branches(id),
  CONSTRAINT stock_movements_ingredient_fk FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT stock_movements_created_by_fk FOREIGN KEY (created_by)    REFERENCES auth.users(id)
);


-- ------------------------------------------------------------
-- WAREHOUSE STOCK
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.warehouse_stock (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  ingredient_id uuid        NOT NULL,
  quantity      numeric     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity  numeric     NOT NULL DEFAULT 0 CHECK (min_quantity >= 0),
  updated_at    timestamptz DEFAULT now(),
  CONSTRAINT warehouse_stock_pkey              PRIMARY KEY (id),
  CONSTRAINT warehouse_stock_ingredient_fk     FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT warehouse_stock_ingredient_unique UNIQUE (ingredient_id)
);


-- ------------------------------------------------------------
-- WAREHOUSE MOVEMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.warehouse_movements (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  ingredient_id uuid        NOT NULL,
  quantity      numeric     NOT NULL,
  type          text        NOT NULL
    CHECK (type = ANY (ARRAY['compra', 'transferencia', 'ajuste'])),
  branch_id     uuid,
  notes         text,
  created_by    uuid,
  created_at    timestamptz DEFAULT now(),
  CONSTRAINT warehouse_movements_pkey          PRIMARY KEY (id),
  CONSTRAINT warehouse_movements_ingredient_fk FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT warehouse_movements_branch_fk     FOREIGN KEY (branch_id)     REFERENCES public.branches(id),
  CONSTRAINT warehouse_movements_created_by_fk FOREIGN KEY (created_by)    REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_warehouse_movements_ingredient
  ON public.warehouse_movements (ingredient_id, created_at);


-- ------------------------------------------------------------
-- PROMOTIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotions (
  id           uuid    NOT NULL DEFAULT gen_random_uuid(),
  name         text    NOT NULL,
  type         text    NOT NULL
    CHECK (type = ANY (ARRAY['BUY_X_GET_Y', 'PERCENTAGE', 'COMBO'])),
  days_of_week integer[] NOT NULL DEFAULT '{}',
  start_date   date    NOT NULL,
  end_date     date    NOT NULL,
  branch_id    uuid,
  active       boolean DEFAULT true,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT promotions_pkey      PRIMARY KEY (id),
  CONSTRAINT promotions_branch_fk FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);


-- ------------------------------------------------------------
-- PROMOTION RULES
-- (category + variant_size para combos flexibles — migraciones 014 y 018)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotion_rules (
  id               uuid    NOT NULL DEFAULT gen_random_uuid(),
  promotion_id     uuid    NOT NULL,
  variant_id       uuid,
  buy_qty          integer CHECK (buy_qty > 0),
  get_qty          integer CHECK (get_qty > 0),
  discount_percent numeric CHECK (discount_percent > 0 AND discount_percent <= 100),
  combo_price      numeric CHECK (combo_price >= 0),
  category         text    CHECK (category IS NULL OR category = ANY (ARRAY['pizza', 'bebida', 'otro'])),
  variant_size     text,   -- sin CHECK constraint (migración 018: acepta cualquier string libre)
  CONSTRAINT promotion_rules_pkey         PRIMARY KEY (id),
  CONSTRAINT promotion_rules_promotion_fk FOREIGN KEY (promotion_id) REFERENCES public.promotions(id),
  CONSTRAINT promotion_rules_variant_fk   FOREIGN KEY (variant_id)   REFERENCES public.product_variants(id)
);


-- ------------------------------------------------------------
-- ORDERS
-- (cancellation — migración 015; idempotency_key — migración 021)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid         NOT NULL DEFAULT gen_random_uuid(),
  branch_id        uuid         NOT NULL,
  cashier_id       uuid         NOT NULL,
  total            numeric      NOT NULL CHECK (total >= 0),
  created_at       timestamptz  DEFAULT now(),
  kitchen_status   varchar      DEFAULT 'pending',
  daily_number     integer      NOT NULL DEFAULT 0,
  payment_method   text         CHECK (payment_method = ANY (ARRAY['efectivo', 'qr'])),
  order_type       text         NOT NULL DEFAULT 'dine_in'
    CHECK (order_type = ANY (ARRAY['dine_in', 'takeaway'])),
  cancelled_at     timestamptz  DEFAULT NULL,
  cancelled_by     uuid         DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  cancel_reason    text         DEFAULT NULL,
  idempotency_key  text,
  CONSTRAINT orders_pkey      PRIMARY KEY (id),
  CONSTRAINT orders_branch_fk  FOREIGN KEY (branch_id)  REFERENCES public.branches(id),
  CONSTRAINT orders_cashier_fk FOREIGN KEY (cashier_id) REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_branch_date
  ON public.orders (branch_id, created_at);

CREATE INDEX IF NOT EXISTS orders_cancelled_at_idx
  ON public.orders (cancelled_at) WHERE cancelled_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique
  ON public.orders (idempotency_key) WHERE idempotency_key IS NOT NULL;


-- ------------------------------------------------------------
-- ORDER ITEMS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id               uuid    NOT NULL DEFAULT gen_random_uuid(),
  order_id         uuid    NOT NULL,
  variant_id       uuid    NOT NULL,
  qty              integer NOT NULL CHECK (qty > 0),
  unit_price       numeric NOT NULL CHECK (unit_price >= 0),
  discount_applied numeric NOT NULL DEFAULT 0 CHECK (discount_applied >= 0),
  qty_physical     integer NOT NULL DEFAULT 1,
  promo_label      text,
  CONSTRAINT order_items_pkey       PRIMARY KEY (id),
  CONSTRAINT order_items_order_fk   FOREIGN KEY (order_id)   REFERENCES public.orders(id),
  CONSTRAINT order_items_variant_fk FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);


-- ------------------------------------------------------------
-- ORDER ITEM FLAVORS (pizzas mitad/mitad — migración 013)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_item_flavors (
  id            uuid    NOT NULL DEFAULT gen_random_uuid(),
  order_item_id uuid    NOT NULL,
  variant_id    uuid    NOT NULL,
  proportion    numeric NOT NULL DEFAULT 0.50 CHECK (proportion > 0 AND proportion <= 1),
  CONSTRAINT order_item_flavors_pkey          PRIMARY KEY (id),
  CONSTRAINT order_item_flavors_order_item_fk FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE,
  CONSTRAINT order_item_flavors_variant_fk    FOREIGN KEY (variant_id)    REFERENCES public.product_variants(id)
);


-- ------------------------------------------------------------
-- APP SETTINGS (migración 019)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text        PRIMARY KEY,
  value      text        NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (key, value) VALUES
  ('telegram_bot_token',              ''),
  ('telegram_chat_id',                ''),
  ('telegram_enabled',                'false'),
  ('telegram_ai_enabled',             'false'),
  ('telegram_ai_model',               'qwen-plus'),
  ('telegram_plan_basic_limit',       '10'),
  ('telegram_plan_pro_limit',         '50'),
  ('telegram_plan_unlimited_limit',   '99999'),
  ('ai_provider',                     'openai_compatible'),
  ('anthropic_api_key',               ''),
  ('openai_compatible_api_key',       ''),
  ('openai_compatible_base_url',      'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'),
  ('telegram_webhook_secret',         '')
ON CONFLICT (key) DO NOTHING;


-- ------------------------------------------------------------
-- TELEGRAM AUTHORIZED CHATS (migración 020)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_authorized_chats (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  chat_id    text        NOT NULL UNIQUE,
  type       text        NOT NULL CHECK (type IN ('personal', 'group')),
  label      text        NOT NULL DEFAULT '',
  plan       text        NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'unlimited')),
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT telegram_authorized_chats_pkey PRIMARY KEY (id)
);


-- ------------------------------------------------------------
-- TELEGRAM USAGE (migración 020)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_usage (
  id            uuid    NOT NULL DEFAULT gen_random_uuid(),
  chat_id       text    NOT NULL,
  date          date    NOT NULL,
  message_count integer NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT telegram_usage_pkey             PRIMARY KEY (id),
  CONSTRAINT telegram_usage_chat_date_unique UNIQUE (chat_id, date)
);


-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------

ALTER TABLE public.branches                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_types             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_prices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_stock              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_movements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_rules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_flavors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_authorized_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_usage            ENABLE ROW LEVEL SECURITY;

-- Política general: authenticated puede leer/escribir todo (ajustar según necesidad)
CREATE POLICY "authenticated_all" ON public.branches
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.variant_types
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.product_variants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.branch_prices
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.ingredients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.branch_stock
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.recipes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.stock_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.warehouse_stock
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.warehouse_movements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.promotions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.promotion_rules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON public.order_item_flavors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- profiles: cada usuario ve/edita su propio perfil; admin ve todos
CREATE POLICY "own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "admin_all_profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

-- app_settings: solo admin
CREATE POLICY "admin_select_app_settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_insert_app_settings" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "admin_update_app_settings" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- telegram_authorized_chats: solo admin
CREATE POLICY "admin_all_telegram_chats" ON public.telegram_authorized_chats
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- telegram_usage: solo admin
CREATE POLICY "admin_all_telegram_usage" ON public.telegram_usage
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
