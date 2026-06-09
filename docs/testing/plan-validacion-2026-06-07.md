# Plan de Validación Manual — Sesión 2026-06-07

> Ejecutar **después** de aplicar todas las migraciones pendientes (`PENDING.md`).
> Marcar cada caso con ✅ (pasa), ❌ (falla) o ⚠️ (comportamiento inesperado).

---

## Prerequisitos

- [ ] Todas las migraciones 023–031 aplicadas en Supabase
- [ ] Servidor corriendo (`npm run dev`)
- [ ] Sesión iniciada como `admin`
- [ ] Tener al menos: 2 sucursales, 3+ productos (mezcla de `made` y `resale`), 2 promos tipo COMBO activas hoy

---

## Módulo 1 — Settings

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1.1 | Ir a `/settings` | Página carga sin Error 500 |
| 1.2 | Verificar campo "Tiempo límite cocina" | Muestra 10 minutos por defecto |
| 1.3 | Cambiar el valor a 15 minutos y guardar | Toast de éxito, valor persiste al recargar |
| 1.4 | Verificar sección Telegram | Campos token y chat_id visibles y editables |

---

## Módulo 2 — Productos (lista)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 2.1 | Ir a `/products` | Carga máximo 10 productos, muestra total (ej. "23 productos") |
| 2.2 | Navegar a página 2 con el paginador | Cambia la página, muestra los siguientes 10 productos |
| 2.3 | Escribir nombre en el buscador | Después de ~300ms filtra por nombre (server-side, no solo en pantalla) |
| 2.4 | Buscar nombre parcial (ej. "piz") | Muestra todos los productos que contienen "piz" |
| 2.5 | Borrar búsqueda con la X del input | Vuelve a la lista completa, página 1 |
| 2.6 | Filtrar por categoría (ej. "Bebida") | Filtra correctamente; combinar con búsqueda también funciona |
| 2.7 | Activar "Ver inactivos" | Aparecen productos inactivos con tag gris |
| 2.8 | En mobile: verificar contador de total | Aparece texto "X productos" encima de las cards |
| 2.9 | En mobile con +10 productos: botones Anterior/Siguiente | Navegan correctamente entre páginas |

---

## Módulo 3 — Registro/edición de productos

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 3.1 | Abrir modal de nuevo producto | Modal de 900px, layout dos columnas en Paso 1 |
| 3.2 | Paso 1: completar nombre, categoría, tipo, descripción | Columna izquierda funciona; imagen se previsualiza a la derecha |
| 3.3 | Paso 2 sin toggle variantes: ver card "Unidad" | Una sola variante por defecto |
| 3.4 | Activar toggle "Este producto tiene tamaños" | Aparece botón "Agregar variante", desaparece "Unidad" |
| 3.5 | Agregar variantes (ej. Pequeña, Mediana, Grande) | Cards en grid, cada una con nombre y precio |
| 3.6 | Desactivar toggle | Variantes desaparecen de la vista |
| 3.7 | Reactivar toggle | **Las variantes originales vuelven** (Pequeña, Mediana, Grande), no aparece vacío |
| 3.8 | Guardar producto nuevo | Aparece en la lista |
| 3.9 | Editar producto con variante inactiva | La variante inactiva aparece gris con botón "Reactivar" |
| 3.10 | Clic en "Reactivar" sobre variante inactiva | La variante vuelve a estado activo con inputs habilitados |
| 3.11 | Guardar edición con variante reactivada | La variante queda activa en la BD |
| 3.12 | Editar producto con variante inactiva sin reactivarla y guardar | La variante permanece inactiva (no se reactiva sola) |
| 3.13 | Después de guardar edición, ir al POS | **El producto aparece con los datos actualizados** (no la versión cacheada) |

---

## Módulo 4 — POS — Combos con mismo tipo de ítem

> Preparar dos promos COMBO activas hoy que compartan un ítem del mismo tipo:
> - **Combo A:** Pizza Pequeña + Refresco Mini × 2
> - **Combo B:** Pizza Pequeña + Refresco Garrafita + Juguete

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 4.1 | Abrir PromoComboModal del Combo A | Modal ancho (~820px desktop), layout dos columnas |
| 4.2 | Completar slots del Combo A y confirmar | Items se agregan al carrito con el descuento del Combo A |
| 4.3 | Abrir PromoComboModal del Combo B | Modal abre correctamente |
| 4.4 | Completar slots del Combo B y confirmar | **Ambos combos aparecen en el carrito con sus descuentos** |
| 4.5 | Verificar que la Pizza del Combo A no desaparece al agregar Combo B | Cada combo tiene su pizza propia; ninguna se "roba" |
| 4.6 | Verificar descuentos separados por combo | Cada grupo muestra su etiqueta y descuento independiente |
| 4.7 | En mobile: PromoComboModal ocupa ancho completo | Layout vertical, checklist oculto, botón muestra "Agregar — Bs X.XX" |

---

## Módulo 5 — POS — Cache y datos actualizados

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 5.1 | Editar nombre de un producto en `/products` | Guardar con éxito |
| 5.2 | Navegar a `/pos` inmediatamente | El producto aparece con el nombre **nuevo** (no el cacheado) |
| 5.3 | Recargar el POS con F5 | El nombre sigue siendo el actualizado |
| 5.4 | Cambiar de sucursal en el POS | Productos se recargan frescos para esa sucursal |

---

## Módulo 6 — POS — Confirmar venta

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 6.1 | Agregar items al carrito y confirmar venta | **No aparece el error `idempotency_key` column not found** |
| 6.2 | La venta se registra correctamente | Orden aparece en cocina y en reportes |
| 6.3 | Intentar confirmar la misma venta dos veces (doble clic rápido) | Solo se registra una orden (idempotency_key previene duplicado) |

---

## Módulo 7 — Performance (verificación visual)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 7.1 | Abrir DevTools → Network; navegar entre tabs del admin | Al cambiar de tab no se disparan nuevos requests (revalidateOnFocus=false) |
| 7.2 | En `/stock`: registrar una compra de insumo | Solo se actualizan los endpoints de stock e historial de insumos; **no se recargan** los de productos ni bodega |
| 7.3 | En `/warehouse`: dejar la página abierta 2 minutos | **No hay requests periódicos** (polling eliminado) |
| 7.4 | En `/ingredients`: cambiar de tab y volver | No dispara refetch automático |

---

## Módulo 8 — Promotions modal (UX)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 8.1 | Ir a `/promotions` y crear nueva promoción tipo COMBO | Modal de ~960px, dos columnas |
| 8.2 | Agregar varias reglas al combo | El panel de reglas tiene scroll interno, no empuja el modal hacia abajo |
| 8.3 | En mobile: el modal se adapta | Layout vertical, usable sin scroll horizontal |

---

## Módulo 9 — Dashboard

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 9.1 | Ir al dashboard (`/`) | Botón naranja "Ir al POS" visible en esquina superior derecha |
| 9.2 | Clic en "Ir al POS" | Abre `/pos` en nueva pestaña |

---

## Checklist final post-validación

- [ ] Todas las migraciones aplicadas y verificadas en Supabase Table Editor
- [ ] `/settings` carga correctamente
- [ ] Confirmación de venta en POS funciona sin errores
- [ ] Dos combos con pizza del mismo tamaño no se interfieren
- [ ] Datos del producto actualizados llegan al POS sin cache stale
- [ ] Paginación y búsqueda de productos funcionan server-side
- [ ] `docs/database/schema-base.sql` actualizado con export de Supabase

---

## Si algo falla

| Síntoma | Qué revisar |
|---------|-------------|
| `/settings` Error 500 | Migración 024 no aplicada |
| Error `idempotency_key` al confirmar venta | Migración 026 no aplicada |
| Dos combos se interfieren | Revisar `src/lib/promotions.ts` función `applyCombo` — línea del skip por `promo_label` |
| POS muestra datos viejos | Revisar `usePosProducts.ts` — el fetch background debe ejecutarse siempre |
| Variante inactiva desaparece al guardar | Revisar `products.service.ts` — `buildPayload` no debe incluir variantes con `is_active=false` |
| Toggle variantes pierde datos | Revisar `useProductForm.ts` — `savedVariantsRef` debe persistir al hacer toggle |
