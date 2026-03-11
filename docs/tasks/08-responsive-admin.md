# Tarea 08 — Responsive Admin Panel

## Objetivo
Hacer el panel de administración responsive: en PC se mantiene el comportamiento actual (tablas), en móvil se adapta (cards, columna única, sin texto redundante).

## Estrategia
- Breakpoint móvil: < 768px
- Detección: hook `useIsMobile` con `Grid.useBreakpoint()` de Ant Design
- Patrón: `isMobile ? <CardView /> : <TableView />`
- Sin librerías nuevas
- Solo se tocan archivos en `components/` — nunca `hooks/` ni `services/`

---

## Pasos

### Paso 1 — Hook base `useIsMobile`
- [ ] Crear `src/lib/useIsMobile.ts`
  - Usa `Grid.useBreakpoint()` de Ant Design
  - Devuelve `isMobile: boolean` (true si `!screens.md`)

---

### Paso 2 — Productos
- [ ] Modificar `src/features/products/components/ProductsTable.tsx`
  - PC: tabla actual sin cambios
  - Móvil: lista de cards (imagen, nombre, categoría badge, variantes como tags, botones acción al pie)

---

### Paso 3 — Insumos
- [ ] Modificar `src/features/ingredients/components/IngredientsTable.tsx`
  - PC: tabla actual sin cambios
  - Móvil: cards compactas (nombre + badge unidad + botones)

---

### Paso 4 — Stock
- [ ] Modificar `src/app/(admin)/stock/page.tsx`
  - Móvil: selector de sucursal full-width, tabs con solo íconos
- [ ] Modificar `src/features/stock/components/StockCurrentTable.tsx`
  - Móvil: cards con nombre, cantidad (verde/rojo), mínimo, estado, botón editar mínimo

---

### Paso 5 — Promociones
- [ ] Modificar `src/features/promotions/components/PromotionsTable.tsx`
  - Móvil: cards con nombre, tipo badge, días activos, vigencia, botones

---

### Paso 6 — Usuarios
- [ ] Modificar `src/features/users/components/UsersTable.tsx`
  - Móvil: cards con nombre, email, rol badge, sucursal, botones

---

### Paso 7 — Sucursales
- [ ] Modificar `src/features/branches/components/BranchesTable.tsx`
  - Móvil: cards con nombre, dirección, estado badge, botones

---

### Paso 8 — Tipos de variante
- [ ] Modificar `src/features/variant-types/components/VariantTypesTable.tsx`
  - Móvil: cards simples (nombre, estado badge, botones)

---

### Paso 9 — Reportes
- [ ] Modificar `src/features/reports/components/ReportFilters.tsx`
  - Móvil: filtros en columna full-width
- [ ] Modificar `src/features/reports/components/SalesSummaryCards.tsx`
  - Móvil: cards apiladas verticalmente
- [ ] Modificar `src/features/reports/components/DailySalesChart.tsx` y `TopProductsChart.tsx`
  - Móvil: gráficos apilados verticalmente (grid 1 columna)
- [ ] Modificar `src/features/reports/components/OrdersTable.tsx`
  - Móvil: cards por orden

---

### Paso 10 — Dashboard
- [ ] Modificar `src/features/dashboard/components/DashboardSummaryCards.tsx`
  - Móvil: tarjetas en columna (1 por fila)
- [ ] Modificar `src/features/dashboard/components/DashboardCharts.tsx`
  - Móvil: gráficos apilados verticalmente

---

### Paso 11 — Bodega
- [ ] Modificar `src/app/(admin)/warehouse/page.tsx` y subpáginas
  - Móvil: formularios en columna, selector full-width
- [ ] Modificar tabla de movimientos de bodega
  - Móvil: cards con fecha, tipo, cantidad, usuario

---

## Estado
- [x] Paso 1 — Hook base
- [x] Paso 2 — Productos
- [x] Paso 3 — Insumos
- [x] Paso 4 — Stock
- [x] Paso 5 — Promociones
- [x] Paso 6 — Usuarios
- [x] Paso 7 — Sucursales
- [x] Paso 8 — Tipos de variante
- [x] Paso 9 — Reportes
- [x] Paso 10 — Dashboard
- [x] Paso 11 — Bodega
