# 07 — Punto de Venta (POS)

## Objetivo
Pantalla del cajero optimizada para PC de escritorio. Permite armar pedidos, aplicar promos automáticas y confirmar ventas.

## Archivos creados
- `src/app/(pos)/layout.tsx` — layout independiente (sin Refine, solo AntdRegistry)
- `src/app/(pos)/pos/page.tsx` — pantalla principal del POS
- `src/app/api/orders/route.ts` — POST crear orden + order_items + deductStock

## Tareas

### Layout general (`app/(pos)/pos/page.tsx`)
- [x] Layout de dos columnas: izquierda catálogo, derecha carrito
- [x] Header con: nombre del cajero, hora en tiempo real, botón logout
- [x] Pantalla fullscreen (h-screen, sin scroll en contenedor principal)

### Catálogo de productos
- [x] Carga productos con variantes y precios de la sucursal del cajero
- [x] Grid de cards: imagen (o emoji fallback), nombre, precio, categoría
- [x] Badge de promo en cards (ej: "2x1", "20% OFF", "COMBO")
- [x] Filtro por categoría: Todos / Pizza / Bebida / Otro
- [x] Click en producto con 1 variante → agrega directo al carrito
- [x] Click en producto con múltiples variantes → modal selector de tamaño con precios

### Carga de promociones
- [x] Al iniciar: carga promos activas del día vía `GET /api/promotions?branchId=&date=`
- [x] Promos visibles como badge en cards y en modal de variantes

### Carrito
- [x] Lista de ítems: nombre, variante, cantidad, precio, descuento, subtotal
- [x] Botones +/- para cambiar cantidad
- [x] Botón eliminar ítem individual
- [x] Descuentos calculados automáticamente con `applyPromotions()` al modificar carrito
- [x] Muestra label de promo aplicada por ítem
- [x] Precio tachado si hay descuento
- [x] Subtotal de descuentos + total final
- [x] Botón "Confirmar venta" (disabled si carrito vacío)
- [x] Botón "Cancelar pedido" (vacía carrito + notifica display)

### Comunicación con display cliente (BroadcastChannel)
- [x] Canal: `pos-display`
- [x] `CART_UPDATE` → al modificar carrito (items + total)
- [x] `CART_CLEAR` → al cancelar o vaciar carrito
- [x] `ORDER_COMPLETE` → al confirmar venta exitosa

### Confirmar venta
- [x] Modal con resumen: ítems, descuentos, total
- [x] Al confirmar: POST `/api/orders` → crea order + order_items + descuenta stock
- [x] Manejo de error con `message.error`
- [x] Post-venta: modal de ticket con nro de orden y resumen
- [x] "Nueva venta" cierra ticket y vuelve al catálogo limpio

### Ticket de venta
- [x] Modal post-venta: nro de orden (últimos 8 chars), ítems, total cobrado
- [x] Botón "Nueva venta" para empezar de cero

### API routes
- [x] `POST /api/orders` — crea orden, order_items y llama `deductStock()`

## Resultado esperado
Cajero puede armar pedidos, ver descuentos automáticos y confirmar ventas con stock descontado en tiempo real.
