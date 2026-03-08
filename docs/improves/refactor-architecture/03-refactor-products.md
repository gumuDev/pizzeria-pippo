# Refactor Task 03 — Products

**Archivo actual:** `src/app/(admin)/products/page.tsx` — 599 líneas
**Estado:** ⏳ Pendiente

---

## Estructura destino

```
src/features/products/
├── components/
│   ├── ProductsTable.tsx         ← tabla con columnas imagen, nombre, categoría, variantes, acciones
│   ├── ProductModal.tsx          ← modal con Steps (3 pasos), orquesta los steps
│   ├── ProductStepGeneral.tsx    ← paso 1: sucursal, nombre, categoría, descripción, imagen
│   ├── ProductStepVariants.tsx   ← paso 2: variantes con precio por sucursal
│   ├── ProductStepRecipes.tsx    ← paso 3: receta por variante (insumos + cantidades)
│   ├── ProductImage.tsx          ← componente imagen con fallback emoji por categoría
│   └── CategoryIcon.tsx          ← emoji por categoría
│
├── hooks/
│   ├── useProducts.ts            ← fetch productos, toggle activo, estado filtros
│   └── useProductForm.ts         ← estado del formulario 3 pasos, variantes, recetas, imagen
│
├── services/
│   └── products.service.ts       ← createProduct(), updateProduct(), toggleActive(), upload()
│
├── types/
│   └── product.types.ts          ← Product, Variant, RecipeItem, BranchPrice, Ingredient
│
└── constants/
    └── product.constants.ts      ← CATEGORY_OPTIONS, VARIANT_OPTIONS, CATEGORY_COLORS, CATEGORY_EMOJI
```

## page.tsx resultado esperado

```tsx
// ~30 líneas
export default function ProductsPage() {
  const {
    products, loading, modalOpen, editing,
    filterCategory, showInactive,
    openCreate, openEdit, closeModal,
    setFilterCategory, setShowInactive,
  } = useProducts();

  return (
    <div className="p-6">
      <ProductsTable
        products={products}
        loading={loading}
        filterCategory={filterCategory}
        showInactive={showInactive}
        onFilterChange={setFilterCategory}
        onToggleInactive={setShowInactive}
        onCreate={openCreate}
        onEdit={openEdit}
      />
      <ProductModal open={modalOpen} editing={editing} onClose={closeModal} />
    </div>
  );
}
```
