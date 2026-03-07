-- ============================================================
-- 008_warehouse_rls.sql
-- RLS para warehouse_stock y warehouse_movements
-- Solo el admin puede acceder — la bodega no es por sucursal
-- ============================================================

-- warehouse_stock
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "warehouse_stock_admin_select" ON public.warehouse_stock
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "warehouse_stock_admin_insert" ON public.warehouse_stock
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "warehouse_stock_admin_update" ON public.warehouse_stock
  FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "warehouse_stock_admin_delete" ON public.warehouse_stock
  FOR DELETE USING (get_user_role() = 'admin');

-- warehouse_movements
ALTER TABLE public.warehouse_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "warehouse_movements_admin_select" ON public.warehouse_movements
  FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "warehouse_movements_admin_insert" ON public.warehouse_movements
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "warehouse_movements_admin_update" ON public.warehouse_movements
  FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "warehouse_movements_admin_delete" ON public.warehouse_movements
  FOR DELETE USING (get_user_role() = 'admin');
