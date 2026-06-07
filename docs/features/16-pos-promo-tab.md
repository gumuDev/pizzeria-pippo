# 16 — Tab Promociones en el POS

## Objetivo

Agregar un tab "Promociones" en el POS que muestre las promociones activas del día y permita al cajero agregarlas al carrito de forma guiada, adaptándose dinámicamente a los 3 tipos de promo existentes.

## Contexto

Antes de este feature, el motor de promociones era puramente reactivo: el cajero agregaba productos uno por uno y el descuento se aplicaba automáticamente si el carrito completaba las condiciones. El problema es que para combos flexibles (ej: "Garrafita = bebida Mini + pizza Pequeña de cualquier sabor"), el cajero no tenía una forma guiada de armar el combo sin saber de memoria qué combinar.

## Archivos creados

- `src/features/pos/components/PromoTab.tsx` — lista de promos activas del día con tarjetas por tipo
- `src/features/pos/components/PromoComboModal.tsx` — modal con flujo guiado slot por slot para combos

## Archivos modificados

- `src/features/pos/hooks/usePosCart.ts` — agregado `addItemsToCart(items[])` para insertar múltiples items a la vez
- `src/features/pos/components/PosHeader.tsx` — `PosTab` type incluye `"promos"`, nueva prop `promoCount` para badge
- `src/app/(pos)/pos/page.tsx` — integración del tab Promociones en desktop y mobile

## Comportamiento por tipo de promo

### BUY_X_GET_Y (tarjeta violeta)
- Muestra: "Compra X llévate X+Y — [Producto] [Variante]"
- Al tocar: agrega `buy_qty` unidades del producto al carrito directamente
- El motor de promociones detecta el carrito y aplica el descuento automáticamente (sin intervención adicional)

### PERCENTAGE (tarjeta azul)
- Muestra: "X% OFF — [Producto] o Todos los productos"
- Solo informativa — no tiene acción de tap
- Badge verde: "Se aplica automáticamente al agregar al carrito"

### COMBO (tarjeta naranja)
- Muestra: "N productos por Bs X"
- Al tocar: abre `PromoComboModal` con flujo guiado

## PromoComboModal — flujo de slots

Cada regla de la promo es un "slot" en el modal:

```
Promo: Garrafita — Bs 45
┌─────────────────────────────────┐
│ ✓ 1  Bebida Mini              │ ← slot resuelto
│   [Guaraná Mini] [Agua Mini]  │
├─────────────────────────────────┤
│   2  Pizza Pequeña            │ ← pendiente
│   [Hawaiana] [Sansa] [4Est.]  │
│   + Pizza mixta (combinar)    │ ← opcional para pizzas
└─────────────────────────────────┘
       [ Agregar combo — Bs 45 ]  ← habilitado solo cuando todos los slots están llenos
```

### Slots fijos (`variant_id` definido en la regla)
- Preseleccionados automáticamente al abrir el modal
- Badge "Fijo", sin opciones para elegir
- Útil para combos donde un producto siempre es el mismo

### Slots flexibles (`category` + `variant_size`)
- Grilla de botones con todos los productos que califican (misma categoría y tamaño)
- El cajero elige uno por slot
- Si el slot es de pizzas: aparece link "+ Pizza mixta" que despliega el FlavorBuilder (igual al de VariantSelectorModal) para combinar sabores con proporciones

### Al confirmar
- Los items van al carrito con sus `variant_id` reales
- El motor de combos los une automáticamente y aplica el descuento proporcional
- En mobile: redirige automáticamente al tab Venta → vista Carrito

## Badge en el header

El tab "Promociones" muestra un badge naranja con la cantidad de promos activas del día, igual al badge rojo de pedidos pendientes en el tab "Pedidos".

## Consideraciones de diseño

- El `PromoComboModal` reutiliza el `FlavorBuilder` interno (no el de `VariantSelectorModal`) para mantener independencia
- `addItemsToCart` en `usePosCart` maneja merge inteligente: items sin flavors se suman a los existentes; items con flavors siempre son líneas separadas
- El motor de `applyCombo` en `promotions.ts` no fue modificado — sigue funcionando reactivamente sobre el carrito resultante
