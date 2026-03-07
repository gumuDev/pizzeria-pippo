# 03 — Autenticación

## Objetivo
Implementar login con Supabase Auth, proteger rutas según rol (admin / cajero) y detectar la sucursal del cajero automáticamente.

## Tareas

### Supabase Auth
- [x] Crear usuarios en Supabase Auth (admin x1, cajero x2)
- [x] Agregar metadata de rol via SQL: `{ role, full_name, branch_id }`
- [x] Tabla `profiles` ya creada en fase 02 con trigger automático

### Página de login
- [x] Crear `app/login/page.tsx` con formulario email + password
- [x] Conectar con Supabase Auth (`signInWithPassword`)
- [x] Mostrar error si credenciales incorrectas
- [x] Redirigir post-login según rol (via `window.location.href`):
  - `admin` → `/dashboard`
  - `cajero` → `/pos`

### Protección de rutas
- [x] Middleware simplificado (passthrough) — Supabase guarda sesión en localStorage, no en cookies del servidor
- [x] Protección real manejada por Refine `authProvider` en el layout del admin
- [ ] Protección del POS (fase 07)

### Refine Auth Provider
- [x] Crear `src/lib/authProvider.ts` con Refine `AuthProvider`
- [x] Implementar `login`, `logout`, `check`, `getPermissions`, `getIdentity`, `onError`
- [x] `getIdentity` retorna `{ id, name, role, branch_id }`
- [x] Conectado al layout admin en `(admin)/layout.tsx`

### Detección automática de sucursal
- [x] Crear `src/hooks/useBranch.ts` — lee `branch_id` de `getIdentity`
- [x] El cajero nunca ve selector de sucursal — se asigna automáticamente desde el perfil

### Logout
- [ ] Botón de logout visible en layout admin (Refine lo provee por defecto en el header)

## Notas
- La sesión de Supabase se almacena en `localStorage` en el cliente
- El middleware del servidor no puede leer esa sesión — la protección de rutas es client-side via Refine
- El rol se lee de `user.user_metadata.role` para el redirect post-login
- Los perfiles se crean automáticamente via trigger `on_auth_user_created`

## Resultado esperado ✅
Login funcional. Admin va a `/dashboard`. Cajero va a `/pos`. Redirección correcta por rol.
