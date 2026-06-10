-- ============================================================
-- 032_fix_rls_security_warnings.sql
-- Corrige todas las advertencias de seguridad reportadas por Supabase:
--
-- 1. user_metadata inseguro en variant_types
--    auth.jwt()->'user_metadata' es editable por el usuario final —
--    reemplazar por get_user_role() que lee desde profiles (server-side).
--
-- 2. auth.<function>() re-evaluado por fila
--    Wrappear con (select ...) para que Postgres lo evalúe una sola vez
--    por query en vez de una vez por fila (mejora de performance).
--
-- 3. EXISTS subqueries en telegram/order tables también re-evaluadas
--    Reemplazar por (select get_user_role()) para consistencia y performance.
-- ============================================================

-- ============================================================
-- PARTE 1 — variant_types: eliminar políticas que usan user_metadata
-- ============================================================

-- Estas dos políticas usan auth.jwt()->'user_metadata' (inseguro, editable por el usuario)
DROP POLICY IF EXISTS "Admins tienen acceso completo a variant_types" ON public.variant_types;
DROP POLICY IF EXISTS "Cajeros pueden leer variant_types" ON public.variant_types;

-- La política anon y las nuevas correctas ya existen, no hay que recrearlas.
-- Las políticas correctas son: variant_types_select_all, variant_types_admin_insert,
-- variant_types_admin_update, variant_types_admin_delete (usan get_user_role()).


-- ============================================================
-- PARTE 2 — profiles: auth.uid() re-evaluado por fila
-- ============================================================

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (
    (id = (SELECT auth.uid()))
    OR ((SELECT public.get_user_role()) = 'admin')
  );

DROP POLICY IF EXISTS profiles_admin_insert ON public.profiles;
CREATE POLICY profiles_admin_insert ON public.profiles
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;
CREATE POLICY profiles_admin_delete ON public.profiles
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');


-- ============================================================
-- PARTE 3 — orders: get_user_role() / get_user_branch_id() estabilizados
-- ============================================================

DROP POLICY IF EXISTS orders_select ON public.orders;
CREATE POLICY orders_select ON public.orders
  FOR SELECT USING (
    ((SELECT public.get_user_role()) = 'admin')
    OR (branch_id = (SELECT public.get_user_branch_id()))
  );

DROP POLICY IF EXISTS orders_insert ON public.orders;
CREATE POLICY orders_insert ON public.orders
  FOR INSERT WITH CHECK (
    ((SELECT public.get_user_role()) = 'admin')
    OR (branch_id = (SELECT public.get_user_branch_id()))
  );

DROP POLICY IF EXISTS orders_kitchen_update ON public.orders;
CREATE POLICY orders_kitchen_update ON public.orders
  FOR UPDATE
  USING (
    ((SELECT public.get_user_role()) = 'cocinero')
    AND (branch_id = (SELECT public.get_user_branch_id()))
  )
  WITH CHECK (
    ((SELECT public.get_user_role()) = 'cocinero')
    AND (branch_id = (SELECT public.get_user_branch_id()))
  );


-- ============================================================
-- PARTE 4 — order_items: EXISTS subquery re-evaluada por fila
-- ============================================================

DROP POLICY IF EXISTS order_items_select ON public.order_items;
CREATE POLICY order_items_select ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          (SELECT public.get_user_role()) = 'admin'
          OR o.branch_id = (SELECT public.get_user_branch_id())
        )
    )
  );

DROP POLICY IF EXISTS order_items_insert ON public.order_items;
CREATE POLICY order_items_insert ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          (SELECT public.get_user_role()) = 'admin'
          OR o.branch_id = (SELECT public.get_user_branch_id())
        )
    )
  );


-- ============================================================
-- PARTE 5 — branch_stock, stock_movements, branches: estabilizar
-- ============================================================

DROP POLICY IF EXISTS stock_select ON public.branch_stock;
CREATE POLICY stock_select ON public.branch_stock
  FOR SELECT USING (
    ((SELECT public.get_user_role()) = 'admin')
    OR (branch_id = (SELECT public.get_user_branch_id()))
  );

DROP POLICY IF EXISTS stock_admin_insert ON public.branch_stock;
CREATE POLICY stock_admin_insert ON public.branch_stock
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS stock_admin_update ON public.branch_stock;
CREATE POLICY stock_admin_update ON public.branch_stock
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS stock_admin_delete ON public.branch_stock;
CREATE POLICY stock_admin_delete ON public.branch_stock
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');

-- stock_movements
DROP POLICY IF EXISTS movements_admin_all ON public.stock_movements;
CREATE POLICY movements_admin_all ON public.stock_movements
  USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS movements_insert ON public.stock_movements;
CREATE POLICY movements_insert ON public.stock_movements
  FOR INSERT WITH CHECK (
    ((SELECT public.get_user_role()) = 'admin')
    OR (branch_id = (SELECT public.get_user_branch_id()))
  );

DROP POLICY IF EXISTS movements_select ON public.stock_movements;
CREATE POLICY movements_select ON public.stock_movements
  FOR SELECT USING (
    ((SELECT public.get_user_role()) = 'admin')
    OR (branch_id = (SELECT public.get_user_branch_id()))
  );

-- branches
DROP POLICY IF EXISTS branches_select ON public.branches;
CREATE POLICY branches_select ON public.branches
  FOR SELECT USING (
    ((SELECT public.get_user_role()) = 'admin')
    OR (id = (SELECT public.get_user_branch_id()))
  );

DROP POLICY IF EXISTS branches_admin_insert ON public.branches;
CREATE POLICY branches_admin_insert ON public.branches
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS branches_admin_update ON public.branches;
CREATE POLICY branches_admin_update ON public.branches
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS branches_admin_delete ON public.branches;
CREATE POLICY branches_admin_delete ON public.branches
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');


-- ============================================================
-- PARTE 6 — Resto de tablas admin-only: estabilizar get_user_role()
-- ============================================================

-- ingredients
DROP POLICY IF EXISTS ingredients_admin_insert ON public.ingredients;
CREATE POLICY ingredients_admin_insert ON public.ingredients
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS ingredients_admin_update ON public.ingredients;
CREATE POLICY ingredients_admin_update ON public.ingredients
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS ingredients_admin_delete ON public.ingredients;
CREATE POLICY ingredients_admin_delete ON public.ingredients
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');

-- products
DROP POLICY IF EXISTS products_admin_insert ON public.products;
CREATE POLICY products_admin_insert ON public.products
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS products_admin_update ON public.products;
CREATE POLICY products_admin_update ON public.products
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS products_admin_delete ON public.products;
CREATE POLICY products_admin_delete ON public.products
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');

-- product_variants
DROP POLICY IF EXISTS variants_admin_insert ON public.product_variants;
CREATE POLICY variants_admin_insert ON public.product_variants
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS variants_admin_update ON public.product_variants;
CREATE POLICY variants_admin_update ON public.product_variants
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS variants_admin_delete ON public.product_variants;
CREATE POLICY variants_admin_delete ON public.product_variants
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');

-- branch_prices
DROP POLICY IF EXISTS branch_prices_admin_insert ON public.branch_prices;
CREATE POLICY branch_prices_admin_insert ON public.branch_prices
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS branch_prices_admin_update ON public.branch_prices;
CREATE POLICY branch_prices_admin_update ON public.branch_prices
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS branch_prices_admin_delete ON public.branch_prices;
CREATE POLICY branch_prices_admin_delete ON public.branch_prices
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');

-- recipes
DROP POLICY IF EXISTS recipes_admin_insert ON public.recipes;
CREATE POLICY recipes_admin_insert ON public.recipes
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS recipes_admin_update ON public.recipes;
CREATE POLICY recipes_admin_update ON public.recipes
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS recipes_admin_delete ON public.recipes;
CREATE POLICY recipes_admin_delete ON public.recipes
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');

-- promotions
DROP POLICY IF EXISTS promotions_admin_insert ON public.promotions;
CREATE POLICY promotions_admin_insert ON public.promotions
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS promotions_admin_update ON public.promotions;
CREATE POLICY promotions_admin_update ON public.promotions
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS promotions_admin_delete ON public.promotions;
CREATE POLICY promotions_admin_delete ON public.promotions
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');

-- promotion_rules
DROP POLICY IF EXISTS promo_rules_admin_insert ON public.promotion_rules;
CREATE POLICY promo_rules_admin_insert ON public.promotion_rules
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS promo_rules_admin_update ON public.promotion_rules;
CREATE POLICY promo_rules_admin_update ON public.promotion_rules
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS promo_rules_admin_delete ON public.promotion_rules;
CREATE POLICY promo_rules_admin_delete ON public.promotion_rules
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');

-- variant_types
DROP POLICY IF EXISTS variant_types_admin_insert ON public.variant_types;
CREATE POLICY variant_types_admin_insert ON public.variant_types
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS variant_types_admin_update ON public.variant_types;
CREATE POLICY variant_types_admin_update ON public.variant_types
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS variant_types_admin_delete ON public.variant_types;
CREATE POLICY variant_types_admin_delete ON public.variant_types
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');

-- warehouse_stock
DROP POLICY IF EXISTS warehouse_stock_admin_select ON public.warehouse_stock;
CREATE POLICY warehouse_stock_admin_select ON public.warehouse_stock
  FOR SELECT USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS warehouse_stock_admin_insert ON public.warehouse_stock;
CREATE POLICY warehouse_stock_admin_insert ON public.warehouse_stock
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS warehouse_stock_admin_update ON public.warehouse_stock;
CREATE POLICY warehouse_stock_admin_update ON public.warehouse_stock
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS warehouse_stock_admin_delete ON public.warehouse_stock;
CREATE POLICY warehouse_stock_admin_delete ON public.warehouse_stock
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');

-- warehouse_movements
DROP POLICY IF EXISTS warehouse_movements_admin_select ON public.warehouse_movements;
CREATE POLICY warehouse_movements_admin_select ON public.warehouse_movements
  FOR SELECT USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS warehouse_movements_admin_insert ON public.warehouse_movements;
CREATE POLICY warehouse_movements_admin_insert ON public.warehouse_movements
  FOR INSERT WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS warehouse_movements_admin_update ON public.warehouse_movements;
CREATE POLICY warehouse_movements_admin_update ON public.warehouse_movements
  FOR UPDATE USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS warehouse_movements_admin_delete ON public.warehouse_movements;
CREATE POLICY warehouse_movements_admin_delete ON public.warehouse_movements
  FOR DELETE USING ((SELECT public.get_user_role()) = 'admin');


-- ============================================================
-- PARTE 7 — app_settings: reemplazar get_user_role() directo
--           por (select get_user_role()) para consistencia
-- ============================================================

DROP POLICY IF EXISTS admin_select_app_settings ON public.app_settings;
CREATE POLICY admin_select_app_settings ON public.app_settings
  FOR SELECT TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS admin_insert_app_settings ON public.app_settings;
CREATE POLICY admin_insert_app_settings ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS admin_update_app_settings ON public.app_settings;
CREATE POLICY admin_update_app_settings ON public.app_settings
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');


-- ============================================================
-- PARTE 8 — telegram tables: EXISTS → (select get_user_role())
-- ============================================================

DROP POLICY IF EXISTS admin_select_telegram_authorized_chats ON public.telegram_authorized_chats;
CREATE POLICY admin_select_telegram_authorized_chats ON public.telegram_authorized_chats
  FOR SELECT TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS admin_insert_telegram_authorized_chats ON public.telegram_authorized_chats;
CREATE POLICY admin_insert_telegram_authorized_chats ON public.telegram_authorized_chats
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS admin_update_telegram_authorized_chats ON public.telegram_authorized_chats;
CREATE POLICY admin_update_telegram_authorized_chats ON public.telegram_authorized_chats
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS admin_delete_telegram_authorized_chats ON public.telegram_authorized_chats;
CREATE POLICY admin_delete_telegram_authorized_chats ON public.telegram_authorized_chats
  FOR DELETE TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS admin_select_telegram_usage ON public.telegram_usage;
CREATE POLICY admin_select_telegram_usage ON public.telegram_usage
  FOR SELECT TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS admin_insert_telegram_usage ON public.telegram_usage;
CREATE POLICY admin_insert_telegram_usage ON public.telegram_usage
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

DROP POLICY IF EXISTS admin_update_telegram_usage ON public.telegram_usage;
CREATE POLICY admin_update_telegram_usage ON public.telegram_usage
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');
