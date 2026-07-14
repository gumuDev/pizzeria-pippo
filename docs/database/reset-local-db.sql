-- ============================================================
-- reset-local-db.sql
-- Borra TODOS los datos de la base local de desarrollo, dejando
-- únicamente un usuario admin (sin sucursal ni negocio asignado).
--
-- SOLO PARA POSTGRES LOCAL (docker). NO correr nunca contra Supabase
-- de producción — no hay vuelta atrás, esto no es una migración de
-- schema, es una limpieza de datos irreversible.
--
-- Uso:
--   1. Editar el email de abajo si tu admin de prueba no es
--      admin@pippo.local.
--   2. docker exec -i pippo_db env PGPASSWORD=postgres psql -U supabase_admin -d postgres < docs/database/reset-local-db.sql
-- ============================================================

\set admin_email 'admin@pippo.local'

BEGIN;

-- 1. Tablas hoja (dependen de orders/product_variants, sin nada que dependa de ellas)
DELETE FROM public.order_item_flavors;
DELETE FROM public.order_items;
DELETE FROM public.promotion_rules;

-- 2. Transacciones y movimientos (dependen de branches/ingredients/product_variants/profiles)
DELETE FROM public.orders;
DELETE FROM public.product_stock_movements;
DELETE FROM public.stock_movements;
DELETE FROM public.warehouse_product_movements;
DELETE FROM public.warehouse_movements;

-- 3. Stock actual (depende de branches/ingredients/product_variants)
DELETE FROM public.branch_product_stock;
DELETE FROM public.branch_stock;
DELETE FROM public.warehouse_product_stock;
DELETE FROM public.warehouse_stock;

-- 4. Configuración de catálogo (depende de product_variants/branches)
DELETE FROM public.promotions;
DELETE FROM public.branch_prices;
DELETE FROM public.recipes;
DELETE FROM public.devices;

-- 5. Catálogo (depende de products/businesses)
DELETE FROM public.product_variants;
DELETE FROM public.products;
DELETE FROM public.variant_types;
DELETE FROM public.ingredients;
DELETE FROM public.product_categories;

-- 6. Bot de Telegram (sin dependencias) y settings (depende de businesses)
DELETE FROM public.telegram_authorized_chats;
DELETE FROM public.telegram_usage;
DELETE FROM public.app_settings;

-- 7. Usuarios: dejar solo el admin indicado, sin sucursal ni negocio
DELETE FROM public.profiles WHERE email <> :'admin_email';
UPDATE public.profiles SET branch_id = NULL, business_id = NULL WHERE email = :'admin_email';

-- 8. Raíz: sucursales y negocios, ahora sin nada que los referencie
DELETE FROM public.branches;
DELETE FROM public.businesses;

COMMIT;

-- Verificación rápida: debe devolver exactamente 1 fila (el admin)
SELECT id, email, role, branch_id, business_id FROM public.profiles;
