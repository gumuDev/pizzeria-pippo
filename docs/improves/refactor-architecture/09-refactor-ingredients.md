# Refactor Task 09 — Ingredients

**Archivo actual:** `src/app/(admin)/ingredients/page.tsx` — 198 líneas
**Estado:** ✅ Completo

---

## Estructura destino

```
src/features/ingredients/
├── components/
│   ├── IngredientsTable.tsx      ← tabla de insumos con nombre, unidad, activo, acciones
│   └── IngredientModal.tsx       ← modal crear/editar insumo
│
├── hooks/
│   └── useIngredients.ts         ← fetch, crear, editar, toggle activo
│
└── services/
    └── ingredients.service.ts    ← getIngredients(), createIngredient(), updateIngredient()
```

## page.tsx resultado esperado

```tsx
// ~25 líneas
export default function IngredientsPage() {
  const { ingredients, loading, modalOpen, editing, openCreate, openEdit, closeModal } = useIngredients();

  return (
    <div className="p-6">
      <IngredientsTable ingredients={ingredients} loading={loading} onCreate={openCreate} onEdit={openEdit} />
      <IngredientModal open={modalOpen} editing={editing} onClose={closeModal} />
    </div>
  );
}
```
