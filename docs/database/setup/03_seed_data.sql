-- ============================================================
-- 03_seed_data.sql
-- Datos de prueba para desarrollo local.
-- Aplicar DESPUÉS de 01_schema.sql, 02_seed_admin.sql
-- y todas las migraciones hasta 028.
--
-- Incluye:
--   - Negocio
--   - Sucursal
--   - Categorías de productos
--   - Tipos de variante
--   - Ingredientes
--   - Productos con variantes
--   - Stock inicial en sucursal
--   - Vinculación admin → negocio + sucursal
-- ============================================================

-- ── 1. Negocio ────────────────────────────────────────────────
INSERT INTO public.businesses (id, name, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Mi Negocio', true)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Sucursal ───────────────────────────────────────────────
INSERT INTO public.branches (id, name, address, is_active)
VALUES ('00000000-0000-0000-0000-000000000010', 'Sucursal Central', 'Av. Principal 123', true)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Vincular admin al negocio y sucursal ───────────────────
-- Asigna business_id y branch_id al perfil admin existente
UPDATE public.profiles
SET
  business_id = '00000000-0000-0000-0000-000000000001',
  branch_id   = '00000000-0000-0000-0000-000000000010'
WHERE role = 'admin';

-- ── 4. Config del negocio en app_settings ────────────────────
UPDATE public.app_settings
SET business_id = '00000000-0000-0000-0000-000000000001'
WHERE business_id IS NULL;

-- ── 5. Categorías de productos ────────────────────────────────
INSERT INTO public.product_categories (id, name, allow_mixing, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000020', 'pizza',  true,  true),
  ('00000000-0000-0000-0000-000000000021', 'bebida', false, true),
  ('00000000-0000-0000-0000-000000000022', 'otro',   false, true)
ON CONFLICT (name) DO UPDATE SET
  allow_mixing = EXCLUDED.allow_mixing,
  is_active    = EXCLUDED.is_active;

-- ── 6. Tipos de variante ──────────────────────────────────────
INSERT INTO public.variant_types (id, name, sort_order, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000030', 'Personal',  1, true),
  ('00000000-0000-0000-0000-000000000031', 'Mediana',   2, true),
  ('00000000-0000-0000-0000-000000000032', 'Familiar',  3, true),
  ('00000000-0000-0000-0000-000000000033', 'Unidad',    4, true),
  ('00000000-0000-0000-0000-000000000034', '500ml',     5, true),
  ('00000000-0000-0000-0000-000000000035', '1L',        6, true)
ON CONFLICT (name) DO NOTHING;

-- ── 7. Ingredientes ───────────────────────────────────────────
INSERT INTO public.ingredients (id, name, unit, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000040', 'Harina',        'kg',     true),
  ('00000000-0000-0000-0000-000000000041', 'Queso mozzarella', 'kg',  true),
  ('00000000-0000-0000-0000-000000000042', 'Salsa de tomate',  'ml',  true),
  ('00000000-0000-0000-0000-000000000043', 'Pepperoni',     'g',      true),
  ('00000000-0000-0000-0000-000000000044', 'Champiñones',   'g',      true),
  ('00000000-0000-0000-0000-000000000045', 'Coca Cola',     'unidad', true),
  ('00000000-0000-0000-0000-000000000046', 'Agua mineral',  'unidad', true)
ON CONFLICT (id) DO NOTHING;

-- ── 8. Productos ──────────────────────────────────────────────
INSERT INTO public.products (id, name, category, description, is_active, track_stock)
VALUES
  ('00000000-0000-0000-0000-000000000050', 'Pepperoni',     'pizza',  'Salsa de tomate, mozzarella y pepperoni', true, true),
  ('00000000-0000-0000-0000-000000000051', 'Champiñones',   'pizza',  'Salsa de tomate, mozzarella y champiñones', true, true),
  ('00000000-0000-0000-0000-000000000052', 'Coca Cola',     'bebida', NULL, true, false),
  ('00000000-0000-0000-0000-000000000053', 'Agua mineral',  'bebida', NULL, true, false)
ON CONFLICT (id) DO NOTHING;

-- ── 9. Variantes ──────────────────────────────────────────────
INSERT INTO public.product_variants (id, product_id, name, base_price, is_active)
VALUES
  -- Pepperoni
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000050', 'Personal',  35.00, true),
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000050', 'Mediana',   55.00, true),
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000050', 'Familiar',  85.00, true),
  -- Champiñones
  ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000051', 'Personal',  33.00, true),
  ('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000051', 'Mediana',   52.00, true),
  ('00000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000051', 'Familiar',  80.00, true),
  -- Coca Cola
  ('00000000-0000-0000-0000-000000000066', '00000000-0000-0000-0000-000000000052', '500ml',     8.00,  true),
  ('00000000-0000-0000-0000-000000000067', '00000000-0000-0000-0000-000000000052', '1L',        12.00, true),
  -- Agua mineral
  ('00000000-0000-0000-0000-000000000068', '00000000-0000-0000-0000-000000000053', '500ml',     5.00,  true)
ON CONFLICT (id) DO NOTHING;

-- ── 10. Precios por sucursal ──────────────────────────────────
-- (opcional si se usan los precios base — solo agregar si se quieren precios distintos por sucursal)
-- INSERT INTO public.branch_prices (branch_id, variant_id, price) VALUES (...);

-- ── 11. Recetas (solo productos con track_stock = true) ───────
INSERT INTO public.recipes (variant_id, ingredient_id, quantity, apply_condition)
VALUES
  -- Pepperoni Personal
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000040', 0.20, 'always'),
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000041', 0.15, 'always'),
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000042', 80,   'always'),
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000043', 60,   'always'),
  -- Pepperoni Mediana
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000040', 0.35, 'always'),
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000041', 0.25, 'always'),
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000042', 130,  'always'),
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000043', 100,  'always'),
  -- Pepperoni Familiar
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000040', 0.55, 'always'),
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000041', 0.40, 'always'),
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000042', 200,  'always'),
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000043', 160,  'always'),
  -- Champiñones Personal
  ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000040', 0.20, 'always'),
  ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000041', 0.15, 'always'),
  ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000042', 80,   'always'),
  ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000044', 80,   'always'),
  -- Champiñones Mediana
  ('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000040', 0.35, 'always'),
  ('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000041', 0.25, 'always'),
  ('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000042', 130,  'always'),
  ('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000044', 130,  'always'),
  -- Champiñones Familiar
  ('00000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000040', 0.55, 'always'),
  ('00000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000041', 0.40, 'always'),
  ('00000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000042', 200,  'always'),
  ('00000000-0000-0000-0000-000000000065', '00000000-0000-0000-0000-000000000044', 180,  'always')
ON CONFLICT DO NOTHING;

-- ── 12. Stock inicial en sucursal ─────────────────────────────
INSERT INTO public.branch_stock (branch_id, ingredient_id, quantity, min_quantity)
VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000040', 10.00, 2.00),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000041', 5.00,  1.00),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000042', 3000,  500),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000043', 1000,  200),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000044', 800,   150)
ON CONFLICT DO NOTHING;
