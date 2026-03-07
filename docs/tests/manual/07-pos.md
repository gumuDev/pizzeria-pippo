# Pruebas Manuales — Módulo 7: Punto de Venta (POS)

## Apertura

- [ ] Cajero inicia sesión → sucursal aparece correctamente sin pedirla
- [ ] Productos con promo activa hoy tienen badge visible ("2x1")
- [ ] Productos sin promo no tienen badge

## Armar pedido

- [ ] Agregar Pizza Mediana x1 → aparece en el resumen con precio correcto
- [ ] Agregar Pizza Mediana x2 con promo 2x1 → descuento aplicado automáticamente
- [ ] El total es correcto (precio de 1 pizza, no 2)
- [ ] Agregar bebida sin promo → suma al total sin descuento
- [ ] Quitar un producto del pedido → el total se recalcula
- [ ] Limpiar el pedido completo → queda vacío

## Confirmar venta

- [ ] Confirmar pedido → aparece número de orden y confirmación
- [ ] Stock se descontó correctamente según la receta
- [ ] BUG A VERIFICAR: Pizza Mediana 2x1 → el stock debe descontar receta x2 (no x1)
- [ ] La venta aparece en "Pedidos del Día"
- [ ] La venta aparece en los reportes

## Pedidos del Día

- [ ] Órdenes ordenadas de la más reciente a la más antigua
- [ ] Solo aparecen órdenes de la sucursal del cajero
- [ ] Clic en una orden → se expande el detalle con productos y descuentos
- [ ] Resumen al pie muestra total de órdenes y total vendido correcto
- [ ] Órdenes pendientes de cocina muestran botón "Marcar listo"
- [ ] Al marcar listo → el botón desaparece y queda como completado
