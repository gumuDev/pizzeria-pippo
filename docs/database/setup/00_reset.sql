-- ============================================================
-- 00_reset.sql
-- Limpia TODOS los datos del negocio excepto los usuarios
-- (profiles, auth.users se mantienen intactos).
--
-- Ejecutar en el SQL Editor de Supabase antes de re-sembrar.
-- ============================================================

-- Desasociar perfiles ANTES de truncar branches (evita que CASCADE borre los perfiles)
UPDATE public.profiles SET branch_id = NULL;

-- Orden inverso de dependencias para respetar FKs

-- Movimientos y órdenes
TRUNCATE public.stock_movements          CASCADE;
TRUNCATE public.product_stock_movements  CASCADE;
TRUNCATE public.warehouse_movements      CASCADE;
TRUNCATE public.order_item_flavors       CASCADE;
TRUNCATE public.order_items              CASCADE;
TRUNCATE public.orders                   CASCADE;

-- Stock
TRUNCATE public.branch_stock             CASCADE;
TRUNCATE public.branch_product_stock     CASCADE;
TRUNCATE public.warehouse_stock          CASCADE;

-- Catálogo
TRUNCATE public.recipes                  CASCADE;
TRUNCATE public.branch_prices            CASCADE;
TRUNCATE public.product_variants         CASCADE;
TRUNCATE public.products                 CASCADE;
TRUNCATE public.ingredients              CASCADE;
TRUNCATE public.variant_types            CASCADE;
TRUNCATE public.product_categories       CASCADE;

-- Promociones
TRUNCATE public.promotion_rules          CASCADE;
TRUNCATE public.promotions               CASCADE;

-- Sucursales y negocio
TRUNCATE public.branches                 CASCADE;
TRUNCATE public.businesses               CASCADE;

-- Config: resetea las claves de negocio en app_settings (key/value)
UPDATE public.app_settings SET value = ''    WHERE key = 'business_name';
UPDATE public.app_settings SET value = ''    WHERE key = 'business_logo_url';
UPDATE public.app_settings SET value = '#f97316' WHERE key = 'business_primary_color';
UPDATE public.app_settings SET value = ''    WHERE key = 'business_type';

-- (profiles ya fueron desasociados al inicio)
