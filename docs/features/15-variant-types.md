# 15 — Tipos de Variante Dinámicos

## Objetivo

Reemplazar los tipos de variante hardcodeados (`Personal`, `Mediana`, `Familiar`) por una tabla configurable en la BD. El admin puede crear, editar y desactivar tipos de variante desde el panel. Al registrar un producto, el selector de variantes carga los tipos disponibles desde la BD.

---

## Cambios en la Base de Datos

### Migración: `012_variant_types.sql`

```sql
-- 1. Nueva tabla de tipos de variante
CREATE TABLE public.variant_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT variant_types_pkey PRIMARY KEY (id),
  CONSTRAINT variant_types_name_unique UNIQUE (name)
);

-- 2. Seed: migrar los tres tipos actuales
INSERT INTO public.variant_types (name, sort_order) VALUES
  ('Personal',  1),
  ('Mediana',   2),
  ('Familiar',  3);

-- 3. Quitar el CHECK constraint de product_variants.name
--    (ahora cualquier nombre de variant_type es válido)
ALTER TABLE public.product_variants
  DROP CONSTRAINT product_variants_name_check;
```

### Estructura resultante

```
variant_types
  id          uuid  PK
  name        text  UNIQUE NOT NULL   ← "Personal", "Mediana", "Familiar", "XL", etc.
  sort_order  int   NOT NULL          ← orden en el selector
  is_active   bool  NOT NULL          ← ocultar sin borrar
  created_at  timestamptz
```

> **Nota de diseño:** `product_variants.name` se mantiene como `text` libre — guarda el nombre del tipo en el momento de creación del producto. Esto permite que si el admin renombra un tipo, los productos existentes no se rompen. La relación es por nombre, no por FK, para mayor flexibilidad.

---

## Panel Admin — Gestión de Tipos de Variante

### Ubicación en el menú
Nueva entrada en el sidebar del admin: **"Tipos de variante"** (debajo de Productos o en una sección de Configuración).

### Ruta
`/admin/variant-types`

### Funcionalidades
- Tabla con columnas: Nombre, Orden, Estado (activo/inactivo), Acciones
- Crear nuevo tipo (modal)
- Editar nombre y orden
- Activar / desactivar (no se puede eliminar si hay productos que lo usan)
- Ordenar por `sort_order` — define el orden en el selector del formulario de productos

### Vista

```
Tipos de Variante                          [ + Nuevo tipo ]

Nombre      Orden   Estado    Acciones
──────────────────────────────────────────
Personal      1     ✅ Activo  [ Editar ]
Mediana       2     ✅ Activo  [ Editar ]
Familiar      3     ✅ Activo  [ Editar ]
XL            4     ✅ Activo  [ Editar ]
```

---

## Cambios en el Formulario de Productos (Paso 2 — Variantes)

### Comportamiento actual
- Lista fija: Personal, Mediana, Familiar
- El admin agrega variantes de esa lista fija, sin repetir

### Comportamiento nuevo
- Lista cargada desde `variant_types` (solo activos, ordenados por `sort_order`)
- El admin selecciona qué tipos aplican a este producto (igual que ahora, sin repetir)
- Si no hay tipos disponibles, muestra aviso: "No hay tipos de variante configurados. Creá uno primero en Configuración → Tipos de variante."

---

## Estructura de Archivos

```
src/features/variant-types/
├── components/
│   ├── VariantTypesTable.tsx     ← tabla con acciones
│   └── VariantTypeModal.tsx      ← modal crear/editar
├── hooks/
│   └── useVariantTypes.ts        ← fetch, crear, editar, toggle activo
├── services/
│   └── variant-types.service.ts  ← getVariantTypes(), create, update, toggle
└── types/
    └── variant-type.types.ts     ← VariantType interface

app/(admin)/variant-types/
  page.tsx                        ← ~25 líneas, solo layout

app/api/variant-types/
  route.ts                        ← GET, POST
  [id]/route.ts                   ← PUT, PATCH (toggle), DELETE
```

---

## Cambios en Productos

- `useProductForm.ts` — cargar `variant_types` activos desde la BD en lugar de `VARIANT_OPTIONS`
- `ProductStepVariants.tsx` — el selector usa la lista dinámica
- `product.constants.ts` — eliminar `VARIANT_OPTIONS` (ya no se usa)

---

## Consideraciones

1. **Compatibilidad hacia atrás**: los productos existentes tienen `product_variants.name = 'Personal' | 'Mediana' | 'Familiar'`. Al hacer el seed en la migración estos nombres ya existen en `variant_types`, así que el formulario de edición los muestra correctamente.
2. **Soft delete**: no se puede desactivar un tipo si hay variantes activas con ese nombre. Mostrar error: "Hay productos usando este tipo. Desactivá las variantes primero."
3. **Sort order**: define el orden visual en el formulario de productos. El admin puede reordenar.
4. **Diseño abierto a futuro**: la columna `name` en `product_variants` es texto libre. Si en el futuro se quiere una relación explícita por FK (`variant_type_id`), es una migración adicional sin romper lo existente.

---

## Criterios de Aceptación

- [ ] Tabla `variant_types` creada con seed de los 3 tipos originales
- [ ] CHECK constraint eliminado de `product_variants.name`
- [ ] Panel `/admin/variant-types` con CRUD completo
- [ ] Crear tipo con nombre y orden
- [ ] Editar nombre y orden de un tipo existente
- [ ] No se puede desactivar un tipo con productos activos que lo usen
- [ ] El formulario de productos (paso 2) carga variantes desde `variant_types`
- [ ] Los productos existentes se editan correctamente (compatibilidad hacia atrás)
- [ ] `VARIANT_OPTIONS` eliminado del código
