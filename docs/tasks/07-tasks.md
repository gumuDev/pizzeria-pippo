# Tareas — Módulo 15: Tipos de Variante Dinámicos

## Orden de ejecución

---

## PASO 1 — Base de Datos

### 1.1 Crear archivo de migración
- [x] Crear `docs/database/migrations/012_variant_types.sql`
  - Tabla `variant_types` (id, name, sort_order, is_active, created_at)
  - Seed: Personal (1), Mediana (2), Familiar (3)
  - DROP CONSTRAINT `product_variants_name_check`

### 1.2 Aplicar en Supabase
- [ ] Aplicar manualmente en SQL Editor de Supabase
- [x] Actualizar `docs/database/schema-base.sql`

---

## PASO 2 — API Routes

### 2.1 Crear `src/app/api/variant-types/route.ts`
- [x] GET — lista todos los tipos activos ordenados por `sort_order`
- [x] POST — crear nuevo tipo (solo admin)

### 2.2 Crear `src/app/api/variant-types/[id]/route.ts`
- [x] PUT — editar nombre y sort_order
- [x] PATCH — toggle is_active (con validación: no desactivar si hay productos usándolo)

---

## PASO 3 — Feature variant-types (panel admin)

### 3.1 Crear tipos
- [x] `src/features/variant-types/types/variant-type.types.ts`
- [x] `src/features/variant-types/services/variant-types.service.ts` — getVariantTypes(), create, update, toggle
- [x] `src/features/variant-types/hooks/useVariantTypes.ts` — fetch, crear, editar, toggle
- [x] `src/features/variant-types/components/VariantTypesTable.tsx` — tabla con acciones
- [x] `src/features/variant-types/components/VariantTypeModal.tsx` — modal crear/editar

### 3.2 Crear página
- [x] `src/app/(admin)/variant-types/page.tsx` (~25 líneas)
- [x] Agregar "Tipos de variante" al sidebar en `src/app/(admin)/layout.tsx`

---

## PASO 4 — Actualizar formulario de productos

### 4.1 Cargar variantes desde la BD
- [x] `useProductForm.ts` — cargar `variant_types` activos al montar (llamada al API)
- [x] Pasar la lista al componente `ProductStepVariants`

### 4.2 Actualizar `ProductStepVariants.tsx`
- [x] Selector de variantes usa la lista dinámica en lugar de `VARIANT_OPTIONS`
- [x] Mostrar aviso si no hay tipos disponibles

### 4.3 Limpiar constantes
- [x] Eliminar `VARIANT_OPTIONS` de `product.constants.ts`

---

## Resumen de archivos

| Archivo | Acción |
|---------|--------|
| `docs/database/migrations/012_variant_types.sql` | Crear |
| `docs/database/schema-base.sql` | Actualizar |
| `src/app/api/variant-types/route.ts` | Crear |
| `src/app/api/variant-types/[id]/route.ts` | Crear |
| `src/features/variant-types/` (todo) | Crear |
| `src/app/(admin)/variant-types/page.tsx` | Crear |
| `src/app/(admin)/layout.tsx` | Modificar |
| `src/features/products/hooks/useProductForm.ts` | Modificar |
| `src/features/products/components/ProductStepVariants.tsx` | Modificar |
| `src/features/products/constants/product.constants.ts` | Modificar |

---

## Notas

- Compatibilidad hacia atrás garantizada por el seed: los nombres existentes en `product_variants` coinciden con los de `variant_types`.
- No usar FK entre `product_variants.name` y `variant_types.name` — relación por texto para flexibilidad futura.
- Al editar un producto, si una variante existente tiene un nombre que ya no está activo en `variant_types`, igual debe mostrarse (no romper edición).
