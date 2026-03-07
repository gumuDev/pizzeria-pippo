# Automation — Módulo 1: Autenticación

## Estado: ✅ Implementado

Archivo: `tests/auth.spec.ts`
Helper: `tests/helpers/auth.ts` — funciones `login(page, role)` reutilizables para todos los módulos

---

## Casos implementados

### Login exitoso por rol
- ✅ Login como admin → verifica redirect a `/dashboard`
- ✅ Login como cajero → verifica redirect a `/pos`
- ✅ Login como cocinero → verifica redirect a `/kitchen`

### Login fallido
- ✅ Credenciales inválidas → verifica mensaje "Credenciales incorrectas" visible y permanece en `/login`

### Protección de rutas sin sesión
- ✅ Acceso a `/dashboard` sin sesión → verifica redirect a `/login?to=%2Fdashboard`
- ✅ Acceso a `/kitchen` sin sesión → verifica redirect a `/login`

### Protección de rutas por rol cruzado
- ✅ Cajero accede a `/kitchen` → verifica redirect a `/login`
- ⚠️ Cocinero accede a `/pos` → **pendiente** (el POS no tiene protección de rol, ver nota abajo)

---

## Notas técnicas

- Las credenciales se leen desde `.env.test` (no commitear)
- Los tests de "sin sesión" usan `browser.newContext()` con storage limpio para garantizar aislamiento real del localStorage de Supabase
- Refine agrega `?to=%2Fdashboard` al redirect — el regex usa `/\/login(\?to=.*)?$/` para matchear ambas formas
- La protección del admin panel requiere `<Authenticated redirectOnFail="/login">` en el `AdminLayout` — fue agregado como fix al implementar estos tests
- El POS (`/pos`) no tiene protección de rol: cualquier usuario autenticado puede acceder. Definir comportamiento esperado antes de implementar ese test.
