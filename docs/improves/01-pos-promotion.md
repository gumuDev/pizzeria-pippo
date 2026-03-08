# Improve: Agrupación visual de combos en el carrito del POS

## Problema actual

Cuando un combo está activo, los ítems aparecen como items independientes en el carrito.
El cajero no tiene una señal visual clara de que esos productos están vinculados por una promoción.

## Comportamiento esperado

Los ítems que comparten el mismo combo deben renderizarse dentro de un contenedor agrupado,
visualmente diferenciado del resto del carrito.

### Ítems normales (sin promo o con PERCENTAGE / BUY_X_GET_Y)
Sin cambios. Se renderizan igual que ahora, como ítems independientes.

### Ítems de combo
Se agrupan dentro de una tarjeta con:

- **Borde naranja** para diferenciarlo del resto del carrito
- **Header** en la parte superior del grupo que muestre:
  - El nombre del combo (ej: "combo personal")
  - El ahorro total del grupo (ej: "- Bs 3.00") alineado a la derecha, en verde
- **Fondo levemente distinto** (naranja muy suave) para reforzar que son parte del mismo grupo
- Los ítems individuales dentro del grupo mantienen su estructura actual:
  nombre, variante, controles de cantidad y precio con tachado

### Ejemplo visual

```
┌─────────────────────────────────────────────┐  ← borde naranja
│  🍕 combo personal            - Bs 3.00     │  ← header (fondo naranja suave)
├─────────────────────────────────────────────┤
│  pizza peperoni                             │
│  Personal                                  │
│  [-] 1 [+]          ~~Bs 10.00~~  Bs 8.00  │
├─────────────────────────────────────────────┤
│  coca cola personal                         │
│  Personal                                  │
│  [-] 1 [+]           ~~Bs 5.00~~  Bs 4.00  │
└─────────────────────────────────────────────┘

pizza sin promo
[-] 1 [+]                          Bs 10.00   ← ítem normal, sin borde
```

## Comportamiento dinámico

- Si el cajero elimina uno de los ítems del combo, el grupo desaparece y el otro
  ítem vuelve a renderizarse como normal (sin descuento, sin borde), porque la
  lógica de `applyPromotions` ya deja de aplicar el combo automáticamente.
- Si hay dos combos distintos activos al mismo tiempo, cada uno forma su propio
  grupo con su propio header y borde.

## Lo que NO cambia

- La lógica de `applyPromotions` y `applyCombo` no se toca
- La estructura de `DiscountedItem` no cambia
- El total y los descuentos se calculan igual que ahora
- El flujo de confirmación de venta no cambia