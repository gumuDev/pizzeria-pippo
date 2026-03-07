# Pruebas Manuales — Módulo 5: Stock (Inventario)

## Entrada de stock (compras)

- [ ] Registrar compra: Tomate 1000g en Sucursal A → stock sube de 0 a 1000g
- [ ] Registrar segunda compra: Tomate 500g → stock sube a 1500g
- [ ] Compra queda registrada en historial con tipo "compra"
- [ ] Compra en Sucursal B no afecta el stock de Sucursal A

## Ajuste manual

- [ ] Ajustar Tomate Sucursal A a 1200g (era 1500g) → stock queda en 1200g
- [ ] Ajuste queda registrado en historial con tipo "ajuste"

## Alertas de stock bajo

- [ ] Configurar mínimo de Tomate en 500g
- [ ] Bajar el stock por debajo de 500g → aparece alerta en el dashboard

## Historial de movimientos

- [ ] Se listan: compras, ventas (automáticas al vender) y ajustes
- [ ] Filtrar movimientos por tipo → solo muestra el tipo seleccionado
- [ ] Filtrar por fecha → solo muestra movimientos del rango elegido
