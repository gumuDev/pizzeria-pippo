-- ============================================================
-- rls-policies-local.sql
-- Funciones de seguridad + RLS completas extraídas de producción
-- Ejecutar en SQL Editor de Studio local (http://localhost:54323)
-- ============================================================

CREATE FUNCTION public.get_user_branch_id() RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    AS $$
  select branch_id from profiles where id = auth.uid();
$$;

CREATE FUNCTION public.get_user_role() RETURNS text
    LANGUAGE sql SECURITY DEFINER
    AS $$
  select role from profiles where id = auth.uid();
$$;

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'cajero'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_authorized_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins tienen acceso completo a variant_types" ON public.variant_types TO authenticated USING ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text)) WITH CHECK ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text));

CREATE POLICY "Cajeros pueden leer variant_types" ON public.variant_types FOR SELECT USING (((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'cajero'::text])));

CREATE POLICY admin_delete_telegram_authorized_chats ON public.telegram_authorized_chats FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY admin_insert_app_settings ON public.app_settings FOR INSERT TO authenticated WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY admin_insert_telegram_authorized_chats ON public.telegram_authorized_chats FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY admin_insert_telegram_usage ON public.telegram_usage FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY admin_select_app_settings ON public.app_settings FOR SELECT TO authenticated USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY admin_select_telegram_authorized_chats ON public.telegram_authorized_chats FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY admin_select_telegram_usage ON public.telegram_usage FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY admin_update_app_settings ON public.app_settings FOR UPDATE TO authenticated USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY admin_update_telegram_authorized_chats ON public.telegram_authorized_chats FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY admin_update_telegram_usage ON public.telegram_usage FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY anon_full_access_variant_types ON public.variant_types TO anon USING (true) WITH CHECK (true);

CREATE POLICY authenticated_insert_variant_types ON public.variant_types FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY branch_prices_admin_delete ON public.branch_prices FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY branch_prices_admin_insert ON public.branch_prices FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY branch_prices_admin_update ON public.branch_prices FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY branch_prices_select_all ON public.branch_prices FOR SELECT USING (true);

CREATE POLICY branches_admin_delete ON public.branches FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY branches_admin_insert ON public.branches FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY branches_admin_update ON public.branches FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY branches_select ON public.branches FOR SELECT USING (((public.get_user_role() = 'admin'::text) OR (id = public.get_user_branch_id())));

CREATE POLICY ingredients_admin_delete ON public.ingredients FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY ingredients_admin_insert ON public.ingredients FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY ingredients_admin_update ON public.ingredients FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY ingredients_select_all ON public.ingredients FOR SELECT USING (true);

CREATE POLICY movements_admin_all ON public.stock_movements USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY movements_insert ON public.stock_movements FOR INSERT WITH CHECK (((public.get_user_role() = 'admin'::text) OR (branch_id = public.get_user_branch_id())));

CREATE POLICY movements_select ON public.stock_movements FOR SELECT USING (((public.get_user_role() = 'admin'::text) OR (branch_id = public.get_user_branch_id())));

CREATE POLICY order_item_flavors_delete ON public.order_item_flavors FOR DELETE USING (true);

CREATE POLICY order_item_flavors_insert ON public.order_item_flavors FOR INSERT WITH CHECK (true);

CREATE POLICY order_item_flavors_select ON public.order_item_flavors FOR SELECT USING (true);

CREATE POLICY order_item_flavors_update ON public.order_item_flavors FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY order_items_insert ON public.order_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND ((public.get_user_role() = 'admin'::text) OR (o.branch_id = public.get_user_branch_id()))))));

CREATE POLICY order_items_select ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND ((public.get_user_role() = 'admin'::text) OR (o.branch_id = public.get_user_branch_id()))))));

CREATE POLICY orders_insert ON public.orders FOR INSERT WITH CHECK (((public.get_user_role() = 'admin'::text) OR (branch_id = public.get_user_branch_id())));

CREATE POLICY orders_kitchen_update ON public.orders FOR UPDATE USING (((public.get_user_role() = 'cocinero'::text) AND (branch_id = public.get_user_branch_id()))) WITH CHECK (((public.get_user_role() = 'cocinero'::text) AND (branch_id = public.get_user_branch_id())));

CREATE POLICY orders_select ON public.orders FOR SELECT USING (((public.get_user_role() = 'admin'::text) OR (branch_id = public.get_user_branch_id())));

CREATE POLICY products_admin_delete ON public.products FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY products_admin_insert ON public.products FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY products_admin_update ON public.products FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY products_select_all ON public.products FOR SELECT USING (true);

CREATE POLICY profiles_admin_delete ON public.profiles FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY profiles_admin_insert ON public.profiles FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY profiles_admin_update ON public.profiles FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (((id = auth.uid()) OR (public.get_user_role() = 'admin'::text)));

CREATE POLICY promo_rules_admin_delete ON public.promotion_rules FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY promo_rules_admin_insert ON public.promotion_rules FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY promo_rules_admin_update ON public.promotion_rules FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY promo_rules_select_all ON public.promotion_rules FOR SELECT USING (true);

CREATE POLICY promotions_admin_delete ON public.promotions FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY promotions_admin_insert ON public.promotions FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY promotions_admin_update ON public.promotions FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY promotions_select_all ON public.promotions FOR SELECT USING (true);

CREATE POLICY recipes_admin_delete ON public.recipes FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY recipes_admin_insert ON public.recipes FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY recipes_admin_update ON public.recipes FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY recipes_select_all ON public.recipes FOR SELECT USING (true);

CREATE POLICY stock_admin_delete ON public.branch_stock FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY stock_admin_insert ON public.branch_stock FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY stock_admin_update ON public.branch_stock FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY stock_select ON public.branch_stock FOR SELECT USING (((public.get_user_role() = 'admin'::text) OR (branch_id = public.get_user_branch_id())));

CREATE POLICY variant_types_admin_delete ON public.variant_types FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY variant_types_admin_insert ON public.variant_types FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY variant_types_admin_update ON public.variant_types FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY variant_types_select_all ON public.variant_types FOR SELECT USING (true);

CREATE POLICY variants_admin_delete ON public.product_variants FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY variants_admin_insert ON public.product_variants FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY variants_admin_update ON public.product_variants FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY variants_select_all ON public.product_variants FOR SELECT USING (true);

CREATE POLICY warehouse_movements_admin_delete ON public.warehouse_movements FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY warehouse_movements_admin_insert ON public.warehouse_movements FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY warehouse_movements_admin_select ON public.warehouse_movements FOR SELECT USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY warehouse_movements_admin_update ON public.warehouse_movements FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY warehouse_stock_admin_delete ON public.warehouse_stock FOR DELETE USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY warehouse_stock_admin_insert ON public.warehouse_stock FOR INSERT WITH CHECK ((public.get_user_role() = 'admin'::text));

CREATE POLICY warehouse_stock_admin_select ON public.warehouse_stock FOR SELECT USING ((public.get_user_role() = 'admin'::text));

CREATE POLICY warehouse_stock_admin_update ON public.warehouse_stock FOR UPDATE USING ((public.get_user_role() = 'admin'::text));

