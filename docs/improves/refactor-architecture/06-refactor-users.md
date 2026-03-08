# Refactor Task 06 — Users

**Archivo actual:** `src/app/(admin)/users/page.tsx` — 346 líneas
**Estado:** ✅ Completo

---

## Estructura destino

```
src/features/users/
├── components/
│   ├── UsersTable.tsx            ← tabla con columnas nombre, email, rol, sucursal, acciones
│   └── UserModal.tsx             ← modal crear/editar usuario
│
├── hooks/
│   └── useUsers.ts               ← fetch usuarios, crear, editar, eliminar
│
├── services/
│   └── users.service.ts          ← getUsers(), createUser(), updateUser(), deleteUser()
│
└── types/
    └── user.types.ts             ← User, UserRole, CreateUserPayload
```

## page.tsx resultado esperado

```tsx
// ~25 líneas
export default function UsersPage() {
  const { users, loading, modalOpen, editing, openCreate, openEdit, closeModal } = useUsers();

  return (
    <div className="p-6">
      <UsersTable users={users} loading={loading} onCreate={openCreate} onEdit={openEdit} />
      <UserModal open={modalOpen} editing={editing} onClose={closeModal} />
    </div>
  );
}
```
