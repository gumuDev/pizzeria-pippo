# Bugs: Bodega Central (warehouse)

## Bug 1 — `stockData.find is not a function` en página de transferencia

**Ubicación:** `src/app/(admin)/warehouse/transfer/page.tsx` — línea 54

```ts
const stockData = await stockRes.json();
if (Array.isArray(stockData)) setWarehouseStock(stockData);  // nunca se cumple

const stockRow = stockData.find((s: WarehouseStock) => s.ingredient_id === preselectedIngredient); // 💥 error
```

**Causa:** El endpoint `/api/warehouse/stock` devuelve `{ data: [...], total: N }`, no un array directo. El check `Array.isArray(stockData)` falla silenciosamente (no asigna `warehouseStock`) y luego `stockData.find(...)` explota porque `stockData` es un objeto, no un array.

**Fix:**
```ts
const stockData = await stockRes.json();
const stockRows: WarehouseStock[] = stockData.data ?? [];
setWarehouseStock(stockRows);

if (preselectedIngredient) {
  form.setFieldValue("ingredient_id", preselectedIngredient);
  const stockRow = stockRows.find((s) => s.ingredient_id === preselectedIngredient);
  // ...
}
```

---

## Bug 2 — La tabla de bodega no se actualiza tras ajustar o transferir

**Ubicación:** `src/features/warehouse/hooks/useWarehouse.ts` — configuración de SWR

```ts
const { data, isLoading, mutate } = useSWR(swrKey, fetchWarehouseStock, {
  revalidateOnFocus: true,
  dedupingInterval: REVALIDATE_INTERVAL * 1000,  // 60 segundos
  keepPreviousData: true,
});
```

**Causa:** `dedupingInterval: 60000` hace que SWR ignore cualquier revalidación durante 60 segundos después de la última fetch. Cuando el usuario vuelve de `/warehouse/transfer` o cierra el modal de ajuste, el `mutate()` se llama pero SWR descarta la revalidación por el deduping.

**Nota:** el `mutate()` en `handleAdjust` y `handleDelete` de `useWarehouse.ts` sí se llama correctamente, pero el deduping lo bloquea.

**Fix:**
```ts
const { data, isLoading, mutate } = useSWR(swrKey, fetchWarehouseStock, {
  revalidateOnFocus: false,   // evita refetch innecesario al cambiar de tab del navegador
  dedupingInterval: 5000,     // bajar a 5s para que mutate() sea efectivo
  keepPreviousData: true,
});
```

Y al volver de la página de transferencia, llamar a `mutate()` con `revalidate: true` explícitamente o reducir el deduping como arriba.

---

## Checklist para resolver

- [ ] Fix Bug 1: corregir lectura de `stockData.data` en `transfer/page.tsx`
- [ ] Fix Bug 2: bajar `dedupingInterval` a 5000ms en `useWarehouse.ts`
- [ ] Verificar que al volver de `/warehouse/transfer` la tabla muestre el stock actualizado
- [ ] Verificar que al cerrar el modal de ajuste la tabla se actualice inmediatamente
