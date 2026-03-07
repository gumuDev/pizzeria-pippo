# TASK: Método de Pago en la Venta

## Descripción
Al momento de confirmar una venta en el POS, el cajero puede seleccionar si el pago fue en efectivo o QR. El campo es opcional — si no se selecciona, la venta se registra sin método de pago. Esta información queda guardada en la orden y se refleja en los reportes.

---

## Cambio en la base de datos

```sql
-- migrations/NNN_add_payment_method_to_orders.sql

ALTER TABLE public.orders
  ADD COLUMN payment_method text CHECK (payment_method = ANY (
    ARRAY['efectivo'::text, 'qr'::text]
  ));

-- NULL = no especificado (campo opcional)
```

---

## Cambio en el POS

### Flujo actual
```
Cajero arma pedido → clic en "Confirmar venta" → venta registrada
```

### Flujo nuevo
```
Cajero arma pedido → clic en "Confirmar venta"
  → aparece selector de método de pago antes de confirmar:

  ┌─────────────────────────────────┐
  │  ¿Cómo pagó el cliente?         │
  │                                 │
  │  [ 💵 Efectivo ]  [ 📱 QR ]     │
  │                                 │
  │  [ Confirmar sin especificar ]  │
  └─────────────────────────────────┘

  → cajero selecciona Efectivo, QR o confirma sin especificar
  → venta se registra con el método elegido
```

### Comportamiento de los botones
- **Efectivo** → registra `payment_method = 'efectivo'`
- **QR** → registra `payment_method = 'qr'`
- **Confirmar sin especificar** → registra `payment_method = NULL`
- El selector aparece como paso intermedio, no interrumpe el flujo del cajero

---

## Dónde se muestra el método de pago

### POS — Pedidos del Día
```
#01  10:32am  Pizza Mediana x2   Bs. 48   💵 Efectivo   [ ✓ Listo ]
#02  11:15am  Pizza Familiar x1  Bs. 60   📱 QR         [ ✓ Listo ]
#03  12:45pm  Pizza Personal x3  Bs. 91   —             [ Marcar listo ]
```

El `—` indica que no se especificó método de pago.

### Reportes
Agregar columna de método de pago en el reporte de ventas:

```
Ventas del día — Sucursal A

#    Hora     Productos             Total     Pago
──────────────────────────────────────────────────
01   10:32    Pizza Mediana x2      Bs. 48    Efectivo
02   11:15    Pizza Familiar x1     Bs. 60    QR
03   12:45    Pizza Personal x3     Bs. 91    —
```

Resumen al pie del reporte:
```
Total cobrado:           Bs. 199
  └── Efectivo:          Bs. 48
  └── QR:                Bs. 60
  └── Sin especificar:   Bs. 91
```

---

## Cambio en la base de datos — resumen

```
orders
  + payment_method text  ← 'efectivo' | 'qr' | NULL
```

No se requiere ningún otro cambio en tablas relacionadas.

---

## Criterios de Aceptación

- [ ] Campo `payment_method` agregado en tabla `orders` como opcional (permite NULL)
- [ ] Al confirmar una venta aparece el selector con opciones: Efectivo, QR y "sin especificar"
- [ ] Seleccionar Efectivo registra `payment_method = 'efectivo'`
- [ ] Seleccionar QR registra `payment_method = 'qr'`
- [ ] Confirmar sin especificar registra `payment_method = NULL`
- [ ] En "Pedidos del Día" del POS se muestra el método de pago de cada orden
- [ ] En el reporte de ventas aparece columna de método de pago
- [ ] El resumen del reporte desglosa el total por método de pago