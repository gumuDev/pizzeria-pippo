# Refactor Task 10 — Display

**Archivo actual:** `src/app/display/page.tsx` — 270 líneas
**Estado:** ⏳ Pendiente

---

## Estructura destino

```
src/features/display/
├── components/
│   ├── DisplayMenu.tsx           ← modo menú: grid de productos con fotos e ingredientes
│   ├── DisplayCart.tsx           ← modo pedido: ítems en tiempo real + total
│   └── DisplayThankYou.tsx       ← modo gracias: pantalla post-venta
│
├── hooks/
│   └── useDisplay.ts             ← BroadcastChannel listener, modo activo, datos del carrito
│
└── types/
    └── display.types.ts          ← DisplayMode, DisplayCartItem, DisplayProduct
```

## page.tsx resultado esperado

```tsx
// ~25 líneas
export default function DisplayPage() {
  const { mode, cart, total, products } = useDisplay();

  return (
    <div className="h-screen bg-gray-900">
      {mode === "menu" && <DisplayMenu products={products} />}
      {mode === "cart" && <DisplayCart cart={cart} total={total} />}
      {mode === "thanks" && <DisplayThankYou />}
    </div>
  );
}
```
