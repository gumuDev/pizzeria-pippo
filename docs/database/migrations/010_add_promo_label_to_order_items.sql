-- Agrega columna promo_label a order_items
-- Permite trazabilidad de descuentos por promoción en el reporte de ventas
-- Los registros anteriores a esta migración tendrán promo_label = null (comportamiento esperado)

ALTER TABLE public.order_items
ADD COLUMN promo_label text NULL;
