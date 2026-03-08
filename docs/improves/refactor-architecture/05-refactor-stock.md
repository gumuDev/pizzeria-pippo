# Refactor Task 05 — Stock

**Archivo actual:** `src/app/(admin)/stock/page.tsx` — 381 líneas
**Estado:** ✅ Completo

---

## Estructura destino

```
src/features/stock/
├── components/
│   ├── StockCurrentTable.tsx     ← tab: stock actual por sucursal con alertas
│   ├── StockPurchaseForm.tsx     ← tab: formulario de compra de insumos
│   ├── StockAdjustForm.tsx       ← tab: formulario de ajuste manual
│   └── StockMovementsTable.tsx   ← tab: historial de movimientos
│
├── hooks/
│   ├── useStock.ts               ← fetch stock actual, branch selector
│   ├── useStockPurchase.ts       ← lógica de compra de insumos
│   ├── useStockAdjust.ts         ← lógica de ajuste manual
│   └── useStockMovements.ts      ← fetch historial de movimientos
│
├── services/
│   └── stock.service.ts          ← getStock(), purchase(), adjust(), getMovements()
│
└── types/
    └── stock.types.ts            ← StockItem, StockMovement, PurchasePayload, AdjustPayload
```

## page.tsx resultado esperado

```tsx
// ~30 líneas
export default function StockPage() {
  const { branch, setBranch } = useStock();

  return (
    <div className="p-6">
      <Tabs>
        <Tab key="actual"><StockCurrentTable branch={branch} /></Tab>
        <Tab key="compras"><StockPurchaseForm branch={branch} /></Tab>
        <Tab key="ajuste"><StockAdjustForm branch={branch} /></Tab>
        <Tab key="historial"><StockMovementsTable branch={branch} /></Tab>
      </Tabs>
    </div>
  );
}
```
