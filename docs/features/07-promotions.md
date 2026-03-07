# 06 — Motor de Promociones

## Objetivo
Sistema flexible de promociones por reglas que se aplican automáticamente en el POS.

## Tareas

### Panel de promociones (`app/(admin)/promotions/page.tsx`)
- [x] Tabla de promociones: nombre, tipo, días de semana, vigencia, sucursal, estado
- [x] Crear / editar / desactivar promociones (switch directo en tabla)

### Formulario de promoción
- [x] Campo: nombre de la promo (ej: "2x1 los miércoles")
- [x] Campo: tipo (`BUY_X_GET_Y` / `PERCENTAGE` / `COMBO`)
- [x] Campo: días de la semana (select múltiple, vacío = todos los días)
- [x] Campo: fecha de inicio y fin (DatePicker rango)
- [x] Campo: sucursal (o "Todas las sucursales")
- [x] Sección de reglas dinámica según tipo:
  - **BUY_X_GET_Y**: variante + compra X + llévate Y gratis
  - **PERCENTAGE**: variante opcional (vacío = todos) + porcentaje
  - **COMBO**: múltiples variantes + precio especial en primera regla

### Lógica del motor (`lib/promotions.ts`)
- [x] Función `getActivePromotions(promotions, branchId, date)` — filtra por sucursal, fecha y día
- [x] Función `applyPromotions(cartItems, activePromotions)` — calcula descuentos
- [x] Lógica BUY_X_GET_Y: unidades gratis según sets completos + parciales
- [x] Lógica PERCENTAGE: descuento % sobre precio unitario × qty
- [x] Lógica COMBO: descuento proporcional si todas las variantes están en carrito
- [x] Sin acumulación: cada item toma el mejor descuento disponible
- [x] `getTotalDiscount(items)` — suma total de descuentos
- [x] `getCartTotal(items)` — total del carrito con descuentos aplicados

### API routes
- [x] `GET /api/promotions` — lista todas las promociones con reglas
- [x] `GET /api/promotions?branchId=&date=` — promos activas para el POS
- [x] `POST /api/promotions` — crear promoción + reglas
- [x] `PUT /api/promotions/[id]` — editar (reemplaza reglas)
- [x] `DELETE /api/promotions/[id]` — eliminar promoción

### Tests del motor
- [ ] Test: BUY_X_GET_Y — carrito con 2 pizzas aplica 2x1 correctamente
- [ ] Test: PERCENTAGE — descuento 20% sobre precio base
- [ ] Test: COMBO — combo especial con pizza + bebida
- [ ] Test: promo fuera de rango de fechas no aplica
- [ ] Test: promo de otro día de semana no aplica

## Resultado esperado
Admin configura promos. El POS las carga automáticamente y aplica descuentos sin intervención del cajero.
