# Refactor Task 04 — Promotions

**Archivo actual:** `src/app/(admin)/promotions/page.tsx` — 490 líneas
**Estado:** ✅ Completo

---

## Estructura destino

```
src/features/promotions/
├── components/
│   ├── PromotionsTable.tsx       ← tabla con columnas nombre, tipo, días, vigencia, sucursal, activa, acciones
│   ├── PromotionModal.tsx        ← modal de crear/editar, orquesta el formulario
│   ├── PromotionFormBase.tsx     ← campos comunes: nombre, tipo, sucursal, días, vigencia
│   ├── RulesBuyXGetY.tsx         ← sección de reglas para tipo BUY_X_GET_Y
│   ├── RulesPercentage.tsx       ← sección de reglas para tipo PERCENTAGE
│   └── RulesCombo.tsx            ← sección de reglas para tipo COMBO
│
├── hooks/
│   ├── usePromotions.ts          ← fetch promos, toggle activo, showInactive
│   └── usePromotionForm.ts       ← estado del formulario, tipo seleccionado, reglas dinámicas
│
├── services/
│   └── promotions.service.ts     ← createPromotion(), updatePromotion(), toggleActive()
│
└── types/
    └── promotion.types.ts        ← Promotion, PromotionRule, PromotionType
```

## page.tsx resultado esperado

```tsx
// ~30 líneas
export default function PromotionsPage() {
  const {
    promotions, loading, modalOpen, editing, showInactive,
    openCreate, openEdit, closeModal,
    toggleActive, setShowInactive,
  } = usePromotions();

  return (
    <div className="p-6">
      <PromotionsTable
        promotions={promotions}
        loading={loading}
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        onCreate={openCreate}
        onEdit={openEdit}
        onToggleActive={toggleActive}
      />
      <PromotionModal open={modalOpen} editing={editing} onClose={closeModal} />
    </div>
  );
}
```
