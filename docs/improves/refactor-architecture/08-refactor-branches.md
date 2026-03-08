# Refactor Task 08 — Branches

**Archivo actual:** `src/app/(admin)/branches/page.tsx` — 236 líneas
**Estado:** ✅ Completo

---

## Estructura destino

```
src/features/branches/
├── components/
│   ├── BranchesTable.tsx         ← tabla de sucursales
│   └── BranchModal.tsx           ← modal crear/editar sucursal
│
├── hooks/
│   └── useBranches.ts            ← fetch, crear, editar, toggle activo
│
└── services/
    └── branches.service.ts       ← getBranches(), createBranch(), updateBranch()
```

## page.tsx resultado esperado

```tsx
// ~25 líneas
export default function BranchesPage() {
  const { branches, loading, modalOpen, editing, openCreate, openEdit, closeModal } = useBranches();

  return (
    <div className="p-6">
      <BranchesTable branches={branches} loading={loading} onCreate={openCreate} onEdit={openEdit} />
      <BranchModal open={modalOpen} editing={editing} onClose={closeModal} />
    </div>
  );
}
```
