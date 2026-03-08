# Spec: Columna "Promoción" en el reporte de órdenes

## Objetivo

Mostrar en el reporte de ventas qué promoción se aplicó a cada ítem,
para tener trazabilidad de los descuentos por pedido.

---

## Cambio 1 — Migración en Supabase

Agregar la columna `promo_label` a la tabla `order_items`.
La columna es nullable porque los ítems sin descuento no tienen etiqueta.

```sql
ALTER TABLE public.order_items
ADD COLUMN promo_label text NULL;
```

---

## Cambio 2 — API: guardar promo_label al confirmar la venta

**Archivo:** `src/app/api/orders/route.ts`

Al insertar los `order_items`, incluir `promo_label` en cada fila.
El dato viene del body que ya envía el POS.

El body actual que llega desde el POS:
```json
{
  "items": [
    {
      "variant_id": "...",
      "qty": 1,
      "qty_physical": 1,
      "unit_price": 10,
      "discount_applied": 2,
      "promo_label": "Combo — combo personal"   ← agregar este campo al insert
    }
  ]
}
```

Si `promo_label` no viene en el body del POS, revisar también
`pos/page.tsx` en el map de `discountedCart` al armar el payload
y asegurarse de que se incluye.

---

## Cambio 3 — POS: incluir promo_label en el payload de la orden

**Archivo:** `src/app/(pos)/pos/page.tsx`

En `handleConfirmSale`, el map de items debe incluir `promo_label`:

```ts
items: discountedCart.map((i) => ({
  variant_id: i.variant_id,
  qty: i.qty_physical,
  qty_physical: i.qty_physical,
  unit_price: i.unit_price,
  discount_applied: i.discount_applied,
  promo_label: i.promo_label ?? null,   ← agregar esta línea
})),
```

---

## Cambio 4 — Reporte: mostrar la nueva columna

**Archivo:** `src/app/(admin)/orders/page.tsx` (o donde viva el reporte)

Agregar la columna **"Promoción"** en la tabla de detalle de ítems,
entre "Descuento" y "Subtotal".

### Comportamiento de la columna

| Caso | Qué muestra |
|---|---|
| Ítem con promo | Label de la promo (ej: `Combo — combo personal`) como `<Tag color="orange">` |
| Ítem sin promo | `—` en gris |
| `discount_applied = 0` pero hay label | No debería ocurrir, mostrar `—` igual |

### Ejemplo visual esperado

```
Producto           Categoría  Cant.  Precio unit.  Descuento   Promoción                Subtotal
pizza peperoni     pizza      1      Bs 10.00      -Bs 2.00    Combo — combo personal   Bs 8.00
coca cola personal bebida     1      Bs  5.00      -Bs 1.00    Combo — combo personal   Bs 4.00
otra pizza         pizza      1      Bs 10.00      —           —                        Bs 10.00
```

---

## Notas

- Los registros anteriores a esta migración tendrán `promo_label = null`
  y mostrarán `—` en el reporte sin ningún problema.
- No se requiere backfill de datos históricos.
- No hay cambios en `promotions.ts` ni en la lógica del motor de promociones.