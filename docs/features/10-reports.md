# 10 — Reportes

## Objetivo
Panel de reportes para el admin con ventas, productos más vendidos, ingresos y alertas de stock.

## Archivos creados
- `src/app/(admin)/reports/page.tsx` — página de reportes
- `src/app/api/reports/sales/route.ts` — resumen de ventas
- `src/app/api/reports/top-products/route.ts` — productos más vendidos
- `src/app/api/reports/daily/route.ts` — ventas por día
- `src/app/api/stock/alerts/route.ts` — alertas de stock bajo (creado en módulo 06)

## Tareas

### Página de reportes (`app/(admin)/reports/page.tsx`)
- [x] Selector de sucursal: Todas / Sucursal A / Sucursal B
- [x] Selector de período: hoy / esta semana / este mes / rango personalizado (DateRangePicker)
- [x] Botones preset: "Hoy", "Esta semana", "Este mes"

### Resumen de ventas
- [x] Total de ventas del período seleccionado (Bs)
- [x] Número de órdenes
- [x] Ticket promedio (Bs)

### Ingresos por categoría
- [x] Gráfico de torta (PieChart recharts): pizza vs bebida vs otro
- [x] Porcentaje y monto por categoría en tooltip

### Productos más vendidos
- [x] Tabla: producto, variante, categoría, unidades vendidas, ingresos generados
- [x] Ordenable por cantidad o ingresos
- [x] Tag de categoría con color

### Ventas por día
- [x] Gráfico de línea (LineChart recharts): ventas diarias en el período
- [x] Filtrable por sucursal

### Alertas de stock en reportes
- [x] Sección con insumos bajo el mínimo configurado
- [x] Indica sucursal por cada alerta
- [x] Link directo a `/stock` para hacer la compra

### API routes
- [x] `GET /api/reports/sales?branchId=&from=&to=` — resumen de ventas (total, count, avg)
- [x] `GET /api/reports/top-products?branchId=&from=&to=` — productos más vendidos
- [x] `GET /api/reports/daily?branchId=&from=&to=` — ventas por día agrupadas
- [x] `GET /api/stock/alerts?branchId=` — alertas de stock bajo

### PWA — acceso desde celular
- [x] Reportes responsivos con Row/Col de Ant Design (xs=24, sm=8, lg=16/8)
- [x] Tablas y gráficos se adaptan a pantalla chica con ResponsiveContainer

## Resultado esperado
Admin puede revisar el estado del negocio desde el panel en PC o desde su celular vía PWA.
