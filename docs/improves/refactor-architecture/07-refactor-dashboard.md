# Refactor Task 07 — Dashboard

**Archivo actual:** `src/app/(admin)/dashboard/page.tsx` — 351 líneas
**Estado:** ⏳ Pendiente

---

## Estructura destino

```
src/features/dashboard/
├── components/
│   ├── DashboardSummaryCards.tsx ← tarjetas de resumen: ventas hoy, órdenes, etc.
│   ├── DashboardStockAlerts.tsx  ← alertas de stock bajo por sucursal
│   └── DashboardRecentOrders.tsx ← últimas órdenes del día
│
├── hooks/
│   └── useDashboard.ts           ← fetch datos del dashboard, branch selector
│
└── services/
    └── dashboard.service.ts      ← getDashboardData(), getStockAlerts()
```

## page.tsx resultado esperado

```tsx
// ~30 líneas
export default function DashboardPage() {
  const { summary, alerts, recentOrders, loading } = useDashboard();

  return (
    <div className="p-6">
      <DashboardSummaryCards data={summary} loading={loading} />
      <DashboardStockAlerts alerts={alerts} />
      <DashboardRecentOrders orders={recentOrders} />
    </div>
  );
}
```
