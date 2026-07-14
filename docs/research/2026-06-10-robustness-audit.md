# Auditoría de robustez: manejo de errores, tests y estándares

**Fecha:** 2026-06-10
**Alcance:** error handling (API + frontend), cobertura de tests, prácticas de sistema robusto.

---

## 1. Lo que ya está bien ✅

| Área | Detalle |
|---|---|
| Infraestructura de errores | `lib/errors.ts` con jerarquía `AppError` (Auth/Forbidden/NotFound/Validation/Conflict) + `apiHandler` que las convierte en respuestas HTTP + `ServiceResult<T>` para services — **bien diseñado** |
| Error boundaries | `app/error.tsx` y `app/(pos)/error.tsx` existen |
| Venta resiliente en cliente | `confirmSale` con timeout (AbortController 15s), mensajes de error de red diferenciados e **idempotency key** (evita ventas duplicadas al reintentar) |
| TypeScript | `strict: true`, `tsc --noEmit` limpio |
| Arquitectura | Feature-based con límites de tamaño — los errores quedan localizados |
| E2E | Playwright configurado y funcionando |

## 2. Brechas encontradas 🔴

### 2.1 Manejo de errores

| # | Brecha | Gravedad | Evidencia |
|---|---|---|---|
| E1 | **La venta no es transaccional**: `/api/orders` hace 4 pasos secuenciales (orden → items → flavors → stock). Si falla un paso intermedio, queda una **orden huérfana** (visible en cocina sin items, o sin descuento de stock) y el dinero/inventario descuadran | 🔴 Crítica | `orders/route.ts` — sin RPC/transacción |
| E2 | `apiHandler` adoptado solo en **5 de 48 routes** — el resto maneja errores ad-hoc; un throw inesperado devuelve un 500 sin formato y sin log | 🔴 Alta | grep `apiHandler` |
| E3 | Sin validación estructurada de payloads (no hay zod/yup); checks manuales parciales. Relacionado: el servidor confía en `total` y precios del cliente (detectado en research multitenant) | 🔴 Alta | `package.json`, `orders/route.ts` |
| E4 | ~~10 catches silenciosos~~ **Re-evaluado durante la Fase 3:** todos los `catch` sin variable muestran `message.error` al usuario o son fallbacks intencionales de caché comentados — falso positivo del grep, sin acción | ✅ N/A | revisión manual 2026-06-10 |
| E5 | `ServiceResult` solo adoptado en 3 services — el resto lanza/devuelve formas inconsistentes | 🟡 Media | grep `ServiceResult` |
| E6 | Sin `error.tsx` para `(admin)`, sin `global-error.tsx` ni `not-found.tsx` | 🟡 Media | find en `src/app` |
| E7 | Sin observabilidad: 11 `console.*` sueltos, sin logging estructurado ni Sentry — los errores de producción en Vercel se pierden | 🟡 Media | grep `console.` |
| E8 | POS offline: maneja el fallo del request, pero no hay cola de reintentos — si se corta internet a mitad de venta, el cajero debe reintentar manualmente | 🟢 Baja (aceptable hoy) | `pos.service.ts` |

### 2.2 Tests

| # | Brecha | Gravedad |
|---|---|---|
| T1 | **Cero unit tests y sin runner instalado** (solo Playwright). La regla del proyecto "every new feature must include unit tests" no se puede cumplir hoy | 🔴 Alta |
| T2 | Lógica pura crítica sin tests: `lib/promotions.ts` (motor de descuentos — calcula dinero), `lib/timezone.ts` (fechas de negocio), `deductStock`/recetas | 🔴 Alta |
| T3 | E2E mínimo: 4 specs / ~20 tests (auth, branches, ingredients). **El flujo POS completo (venta → cocina → ticket) no está cubierto** — es el camino más crítico del negocio | 🟡 Media |

### 2.3 Score general

| Estándar | Estado |
|---|---|
| Tipado estricto | 🟢 |
| Arquitectura modular | 🟢 |
| Errores tipados + handler central | 🟡 diseñado pero sub-adoptado |
| Atomicidad de operaciones críticas | 🔴 |
| Validación de inputs server-side | 🔴 |
| Unit tests | 🔴 inexistentes |
| E2E | 🟡 base mínima |
| Observabilidad | 🔴 |
| Seguridad RLS | 🟡 (ver research multitenant — fase 0) |

## 3. Plan recomendado (priorizado)

### P0 — riesgo de dinero/datos (hacer antes del multitenant)

1. **Venta transaccional**: función Postgres `create_order(...)` (RPC) que inserte
   orden + items + flavors + descuento de stock en una transacción. Migración + 
   simplificación de `/api/orders`. *(Tamaño: M)*
2. **Adoptar `apiHandler` en las 48 routes** — cambio mecánico, gran retorno. *(S/M)*
3. **Recalcular precios/totales en servidor** — ya planificado en multitenant Fase 2;
   si el multitenant se retrasa, adelantarlo. *(M)*

### P1 — fundación de tests

4. **Instalar Vitest** (ligero, integra con el stack Vite/TS sin config pesada) +
   primeros unit tests de `lib/promotions.ts` (el archivo que calcula dinero),
   `lib/timezone.ts` y `escpos.service.ts` (rama impresora) — toda esta lógica es pura
   y trivial de testear. Script `npm run test:unit`. *(M)*
5. **Spec Playwright del flujo POS completo**: login cajero → agregar productos →
   promo → confirmar venta → ticket → orden visible en pedidos del día. *(M)*
6. **Zod para payloads críticos** (`/api/orders` primero). *(S)*

### P2 — pulido de robustez

7. `error.tsx` para `(admin)` + `not-found.tsx` global. *(S)*
8. Eliminar los 10 catches silenciosos (mínimo: log + mensaje al usuario). *(S)*
9. Sentry free tier (errores de producción visibles) o al menos logging estructurado
   en `apiHandler`. *(S)*
10. Extender `ServiceResult` al resto de services. *(M, gradual)*

## 4. Conclusión

La base de diseño es buena (errores tipados, handler central, idempotencia, strict TS),
pero está **a medio adoptar**: el patrón existe y el 90% del código no lo usa. Los dos
riesgos reales para un sistema que maneja dinero son la **venta no transaccional** (E1)
y la **ausencia total de unit tests** (T1/T2) sobre la lógica que calcula precios y
descuentos. Resolver P0 + P1 pone el proyecto en estándar de sistema robusto y deja el
terreno mucho más firme para el multitenant.
