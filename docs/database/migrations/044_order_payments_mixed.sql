-- ============================================================
-- 044_order_payments_mixed.sql
-- Pago mixto en el POS: una orden puede pagarse parte en
-- efectivo y parte en QR. Se agrega `order_payments` (una fila
-- por método usado en la orden) y se permite el valor 'mixto'
-- en `orders.payment_method`.
--
-- Compatibilidad: si una orden se paga con un solo método (como
-- hoy), no se inserta nada en `order_payments` — orders sigue
-- funcionando exactamente igual que antes.
--
-- Requiere actualizar create_order_atomic (033, redefinida en
-- 042) para que también inserte en `order_payments` cuando el
-- payload trae un array `payments` — se redefine completa acá.
-- ============================================================

-- 1. Tabla de pagos por orden
CREATE TABLE public.order_payments (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  order_id   uuid        NOT NULL,
  method     text        NOT NULL CHECK (method = ANY (ARRAY['efectivo'::text, 'qr'::text])),
  amount     numeric     NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT order_payments_pkey PRIMARY KEY (id),
  CONSTRAINT order_payments_order_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

CREATE INDEX idx_order_payments_order ON public.order_payments (order_id);

-- 2. RLS + GRANT — checklist de docs/database/README.md
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.order_payments TO authenticated;
GRANT ALL ON TABLE public.order_payments TO service_role;

CREATE POLICY "admin_select_order_payments"
  ON public.order_payments FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "admin_insert_order_payments"
  ON public.order_payments FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

-- 3. `orders.payment_method` admite el nuevo valor 'mixto'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IS NULL OR payment_method = ANY (ARRAY['efectivo'::text, 'qr'::text, 'online'::text, 'mixto'::text]));

-- 4. Redefinir create_order_atomic: agrega el insert de order_payments
CREATE OR REPLACE FUNCTION public.create_order_atomic(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id        uuid := (payload->>'branch_id')::uuid;
  v_cashier_id       uuid := (payload->>'cashier_id')::uuid;
  v_total            numeric := (payload->>'total')::numeric;
  v_payment_method   text := payload->>'payment_method';
  v_payment_provider text := payload->>'payment_provider';
  v_order_type       text := payload->>'order_type';
  v_idempotency_key  text := NULLIF(payload->>'idempotency_key', '');
  v_day_start        timestamptz := (payload->>'day_start')::timestamptz;
  v_day_end          timestamptz := (payload->>'day_end')::timestamptz;
  v_existing         record;
  v_daily_number     integer;
  v_order_id         uuid;
  v_item             jsonb;
  v_item_id          uuid;
  v_flavor           jsonb;
  v_ded              jsonb;
  v_payment          jsonb;
BEGIN
  -- Idempotencia: si la key ya fue usada, devolver la orden existente
  IF v_idempotency_key IS NOT NULL THEN
    SELECT id, daily_number INTO v_existing
    FROM orders WHERE idempotency_key = v_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'order_id', v_existing.id,
        'daily_number', v_existing.daily_number,
        'duplicate', true
      );
    END IF;
  END IF;

  -- Serializar la numeración por sucursal+día (fix de race condition)
  PERFORM pg_advisory_xact_lock(hashtext(v_branch_id::text || (payload->>'day_start')));

  SELECT COALESCE(MAX(daily_number), 0) + 1 INTO v_daily_number
  FROM orders
  WHERE branch_id = v_branch_id
    AND created_at >= v_day_start
    AND created_at <= v_day_end;

  INSERT INTO orders (branch_id, cashier_id, total, daily_number, payment_method, payment_provider, order_type, idempotency_key)
  VALUES (v_branch_id, v_cashier_id, v_total, v_daily_number, v_payment_method, v_payment_provider, v_order_type, v_idempotency_key)
  RETURNING id INTO v_order_id;

  -- Desglose de pago mixto (opcional) — una fila por método usado
  FOR v_payment IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'payments', '[]'::jsonb)) LOOP
    INSERT INTO order_payments (order_id, method, amount)
    VALUES (v_order_id, v_payment->>'method', (v_payment->>'amount')::numeric);
  END LOOP;

  -- Items + sabores (pizzas mixtas)
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items') LOOP
    INSERT INTO order_items (order_id, variant_id, qty, qty_physical, unit_price, discount_applied, promo_label)
    VALUES (
      v_order_id,
      (v_item->>'variant_id')::uuid,
      (v_item->>'qty')::integer,
      (v_item->>'qty_physical')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'discount_applied')::numeric,
      v_item->>'promo_label'
    )
    RETURNING id INTO v_item_id;

    FOR v_flavor IN SELECT * FROM jsonb_array_elements(COALESCE(v_item->'flavors', '[]'::jsonb)) LOOP
      INSERT INTO order_item_flavors (order_item_id, variant_id, proportion)
      VALUES (v_item_id, (v_flavor->>'variant_id')::uuid, (v_flavor->>'proportion')::numeric);
    END LOOP;
  END LOOP;

  -- Stock de ingredientes (elaboración propia) + movimientos
  FOR v_ded IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'ingredient_deductions', '[]'::jsonb)) LOOP
    UPDATE branch_stock
    SET quantity = quantity - (v_ded->>'quantity')::numeric
    WHERE branch_id = v_branch_id
      AND ingredient_id = (v_ded->>'ingredient_id')::uuid;

    INSERT INTO stock_movements (branch_id, ingredient_id, quantity, type, notes, created_by)
    VALUES (
      v_branch_id,
      (v_ded->>'ingredient_id')::uuid,
      -((v_ded->>'quantity')::numeric),
      'venta',
      'Orden ' || v_order_id,
      v_cashier_id
    );
  END LOOP;

  -- Stock de productos de reventa + movimientos
  FOR v_ded IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'resale_deductions', '[]'::jsonb)) LOOP
    UPDATE branch_product_stock
    SET quantity = quantity - (v_ded->>'quantity')::numeric,
        updated_at = now()
    WHERE branch_id = v_branch_id
      AND variant_id = (v_ded->>'variant_id')::uuid;

    INSERT INTO product_stock_movements (branch_id, variant_id, quantity, type, notes, created_by)
    VALUES (
      v_branch_id,
      (v_ded->>'variant_id')::uuid,
      -((v_ded->>'quantity')::numeric),
      'venta',
      'Orden ' || v_order_id,
      v_cashier_id
    );
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'daily_number', v_daily_number,
    'duplicate', false
  );

EXCEPTION
  -- Dos requests simultáneos con la misma idempotency key: el segundo
  -- choca con el índice único → devolver la orden que ganó la carrera
  WHEN unique_violation THEN
    IF v_idempotency_key IS NOT NULL THEN
      SELECT id, daily_number INTO v_existing
      FROM orders WHERE idempotency_key = v_idempotency_key;
      IF FOUND THEN
        RETURN jsonb_build_object(
          'order_id', v_existing.id,
          'daily_number', v_existing.daily_number,
          'duplicate', true
        );
      END IF;
    END IF;
    RAISE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order_atomic(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb) TO service_role;
