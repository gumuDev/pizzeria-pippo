# Refactor Task 02 — Reports

**Archivo actual:** `src/app/(admin)/reports/page.tsx` — 738 líneas
**Estado:** ⏳ Pendiente

---

## Estructura destino

```
src/features/reports/
├── components/
│   ├── ReportFilters.tsx         ← selector de sucursal, rango de fechas, botón aplicar
│   ├── SalesSummaryCards.tsx     ← tarjetas: total Bs, cantidad ventas, promedio
│   ├── DailySalesChart.tsx       ← LineChart de ventas por día (recharts)
│   ├── TopProductsChart.tsx      ← PieChart de productos más vendidos
│   ├── TopProductsTable.tsx      ← tabla de top productos con qty y total
│   ├── CashierReportTable.tsx    ← tabla de ventas por cajero
│   ├── OrdersTable.tsx           ← tabla de órdenes con expandable de ítems
│   ├── OrderItemsTable.tsx       ← tabla interna de ítems (dentro del expandable)
│   └── StockAlerts.tsx           ← alertas de stock bajo (sucursales + bodega)
│
├── hooks/
│   ├── useReportFilters.ts       ← estado de filtros: branch, fechas, tab activo
│   ├── useSalesReport.ts         ← fetch summary + daily + top-products
│   ├── useCashierReport.ts       ← fetch reporte por cajero
│   └── useOrdersReport.ts        ← fetch órdenes paginadas
│
├── services/
│   └── reports.service.ts        ← fetchSales(), fetchDaily(), fetchOrders(), etc.
│
└── types/
    └── reports.types.ts          ← SalesSummary, DailyData, TopProduct, Order, OrderItem
```

## page.tsx resultado esperado

```tsx
// ~50 líneas
export default function ReportsPage() {
  const filters = useReportFilters();
  const sales = useSalesReport(filters);
  const orders = useOrdersReport(filters);

  return (
    <div className="p-6">
      <ReportFilters filters={filters} />
      <Tabs>
        <Tab key="ventas">
          <SalesSummaryCards data={sales.summary} />
          <DailySalesChart data={sales.daily} />
          <TopProductsChart data={sales.topProducts} />
          <OrdersTable orders={orders.data} />
        </Tab>
        <Tab key="cajeros">
          <CashierReportTable data={sales.cashiers} />
        </Tab>
      </Tabs>
      <StockAlerts />
    </div>
  );
}
```
