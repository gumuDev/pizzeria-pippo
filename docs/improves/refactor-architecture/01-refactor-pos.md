# Refactor Task 01 — POS

**Archivo actual:** `src/app/(pos)/pos/page.tsx` — 866 líneas
**Estado:** ⏳ Pendiente

---

## Estructura destino

```
src/features/pos/
├── components/
│   ├── PosHeader.tsx             ← header con logo, cajero, sucursal, reloj, botón logout
│   ├── ProductCatalog.tsx        ← grid de productos con filtro por categoría
│   ├── ProductCard.tsx           ← tarjeta individual de producto con badge de promo
│   ├── PosCart.tsx               ← panel derecho completo del carrito
│   ├── CartItem.tsx              ← ítem individual del carrito (normal)
│   ├── CartComboGroup.tsx        ← grupo visual de combo con borde naranja
│   ├── CartFooter.tsx            ← total, descuentos, botones confirmar/cancelar
│   ├── VariantSelectorModal.tsx  ← modal para elegir variante al agregar producto
│   ├── PaymentModal.tsx          ← modal de selección de método de pago
│   ├── TicketModal.tsx           ← modal de ticket post-venta
│   └── DayOrdersPanel.tsx        ← panel lateral de órdenes del día
│
├── hooks/
│   ├── usePosIdentity.ts         ← carga usuario, rol y branch_id desde Supabase
│   ├── usePosProducts.ts         ← fetch de productos y variantes por sucursal
│   ├── usePosPromotions.ts       ← fetch de promos activas del día
│   ├── usePosCart.ts             ← estado del carrito, add/remove/update/clear
│   ├── usePosBroadcast.ts        ← BroadcastChannel hacia display
│   └── useDayOrders.ts           ← fetch y suscripción realtime a órdenes del día
│
├── services/
│   └── pos.service.ts            ← confirmSale(), getProducts(), getPromotions()
│
└── types/
    └── pos.types.ts              ← Identity, Product, Variant, CartItem, DayOrder
```

## page.tsx resultado esperado

```tsx
// ~60 líneas
export default function PosPage() {
  const identity = usePosIdentity();
  const { products, promotions } = usePosProducts(identity?.branch_id);
  const cart = usePosCart(products, promotions, identity?.branch_id);
  const { dayOrders } = useDayOrders(identity?.branch_id);

  if (!identity) return <PosLoadingScreen />;

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <PosHeader identity={identity} onLogout={...} />
      <div className="flex flex-1 overflow-hidden">
        <ProductCatalog products={products} onAdd={cart.addToCart} />
        <PosCart cart={cart} onConfirm={...} onCancel={...} />
      </div>
      <VariantSelectorModal ... />
      <PaymentModal ... />
      <TicketModal ... />
      <DayOrdersPanel orders={dayOrders} ... />
    </div>
  );
}
```
