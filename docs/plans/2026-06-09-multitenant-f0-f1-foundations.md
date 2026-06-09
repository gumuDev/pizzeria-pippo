# Feature: Multitenant — Fase 0 y Fase 1 (fundaciones de BD y seguridad)

**Fecha:** 2026-06-09
**Estado:** Pendiente de aprobación
**Rama:** `feature/multitenant`
**Basado en:** `docs/research/2026-06-09-multitenant-feasibility.md`

---

## 1. Objetivo

Sentar las fundaciones del SaaS multitenant sin romper la operación actual de Pippo:

- **Fase 0:** cerrar los huecos de seguridad de la RLS actual (pre-requisito).
- **Fase 1:** introducir `tenants` + `tenant_id`, migrar Pippo como tenant #1,
  rol `superadmin` y RLS v2 con aislamiento por comercio.

Al terminar estas fases, la app sigue funcionando exactamente igual para Pippo,
pero la base de datos ya es multitenant y es **imposible** que un usuario de un
comercio lea datos de otro.

## 2. Decisiones asumidas (confirmar con el usuario)

| Decisión | Asunción para esta fase |
|---|---|
| Acceso | Mismo dominio, tenant resuelto por login (subdominios: futuro) |
| Registro de comercios | No incluido aquí — Fase 4 (mientras tanto, alta manual) |
| Billing/planes | Fuera del MVP — la tabla `tenants` deja campo `plan` preparado |
| Categorías por tenant | Diferido a Fase 5 — el CHECK actual se mantiene por ahora |
| Bot Telegram | Sigue single-tenant (asignado al tenant Pippo) hasta Fase 6 |

## 3. Alcance

### Fase 0 — Endurecimiento RLS (migración `033`)

Cierra las brechas G2 del research. **Sin cambios de código** (todas las pantallas
ya operan autenticadas):

1. `products_select_all`, `ingredients_select_all`, `branch_prices_select_all`,
   `promo_rules_select_all`: `USING (true)` → `TO authenticated`.
2. `order_item_flavors_*` (todas `USING (true)`): scope por pertenencia de la orden
   (vía `order_items` → `orders` con las reglas de branch existentes).
3. `variant_types`: eliminar `anon_full_access_variant_types` y las políticas basadas
   en `auth.jwt() -> user_metadata`; reemplazar por `get_user_role()` como el resto.
4. Verificación: suite Playwright completa + smoke manual de POS/cocina/display.

> Nota: depende de que las migraciones de `PENDING.md` (023–032) estén aplicadas,
> en particular `032_fix_rls_security_warnings.sql`.

### Fase 1 — Schema multitenant

**Migración `034` — tenants y tenant_id:**

```
tenants (
  id uuid PK default gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  business_type text NOT NULL DEFAULT 'pizzeria',
  logo_url text,
  status text NOT NULL DEFAULT 'active'  CHECK (active | suspended),
  plan text NOT NULL DEFAULT 'free',
  created_at timestamptz default now()
)
```

1. Crear `tenants` + insertar el tenant **Pippo** (slug `pippo`).
2. Agregar `tenant_id uuid NULL` a las tablas raíz:
   `branches`, `products`, `ingredients`, `variant_types`, `promotions`,
   `warehouse_stock`, `warehouse_movements`, `profiles`,
   `telegram_authorized_chats`, `telegram_usage`
   (+ `branch_product_stock`, `warehouse_product_stock` y movimientos si ya existen
   por migraciones 028/029).
3. Backfill: todas las filas existentes → tenant Pippo. `profiles.tenant_id` queda
   `NULL` solo para futuros superadmins.
4. `NOT NULL` en todas (excepto `profiles.tenant_id`) + FK a `tenants` + índices
   `(tenant_id)` en cada una.
5. `app_settings`: PK pasa de `(key)` a `(tenant_id, key)` con backfill a Pippo.
6. Constraints únicos re-scoped: `variant_types.name` UNIQUE → UNIQUE `(tenant_id, name)`;
   `warehouse_stock.ingredient_id` se mantiene (ingredient ya es del tenant).
7. Helper `get_user_tenant_id()` (SECURITY DEFINER, lee `profiles`).
8. `profiles.role` CHECK: agregar `'superadmin'`.
9. Trigger `handle_new_user`: propagar `tenant_id` desde `raw_user_meta_data`.

> Las tablas hijas (`order_items`, `recipes`, `branch_prices`, `order_item_flavors`,
> `product_variants`, `promotion_rules`, `orders`, `stock_movements`, `branch_stock`)
> **no** llevan `tenant_id`: heredan el aislamiento por FK a su tabla raíz. Se
> desnormalizará solo si la performance de RLS lo exige (medir antes).

**Migración `035` — RLS v2:**

- Toda política se reescribe combinando **tenant + rol**, patrón único:
  `USING (tenant_id = get_user_tenant_id() AND <regla de rol existente>)` para tablas
  raíz, y subconsulta vía FK para tablas hijas.
- `superadmin`: SELECT sobre `tenants` y vistas agregadas (conteo de órdenes/productos
  por tenant). **No** accede a datos operativos de los comercios en esta fase.
- `tenants`: SELECT del propio tenant para usuarios del comercio; ALL para superadmin.

**Cambios de código (mínimos, solo para no romper Pippo):**

| Archivo | Cambio |
|---|---|
| `src/lib/tenant.ts` (nuevo) | `getTenantId(user)` para API routes — resuelve el tenant del profile (server-side) |
| `src/app/api/settings/route.ts` | GET/PUT scoped por tenant (el upsert `onConflict: "key"` rompe con la PK nueva → `onConflict: "tenant_id,key"`) |
| `src/app/api/settings/printer/route.ts` | Lectura scoped por tenant |
| `src/lib/authProvider.ts` | Exponer `tenant_id` en identity (sin cambios de UI) |

La migración completa de las 49 API routes y services del frontend es **Fase 2**
(plan aparte) — en Fase 1 la RLS ya garantiza el aislamiento de los queries directos,
y las routes con service role siguen sirviendo a un solo tenant (Pippo).

## 4. Tests y validación

1. **Script de aislamiento** `docs/database/tests/tenant-isolation-test.sql`:
   crea 2 tenants de prueba + 1 usuario por tenant y verifica con asserts que ninguno
   lee productos/órdenes/settings del otro (se corre en el SQL Editor; rollback al final).
2. **Suite Playwright existente** completa contra el tenant Pippo (regresión funcional).
3. `tsc --noEmit` tras cada cambio de código.
4. Smoke manual: login admin, POS venta completa, cocina, settings.

## 5. Pasos de implementación (en orden, validando entre pasos)

1. Escribir migración `033` (Fase 0) → **el usuario la aplica en Supabase** → correr
   Playwright + smoke → validación del usuario.
2. Escribir migraciones `034` y `035` + script de aislamiento.
3. **Usuario aplica `034`** → verificar backfill (queries de conteo incluidas en el archivo).
4. Cambios de código mínimos (`lib/tenant.ts`, settings routes, authProvider) + `tsc`.
5. **Usuario aplica `035`** → correr script de aislamiento + Playwright + smoke.
6. Actualizar `schema-base.sql`, `PENDING.md` y este plan a "Implementado".

## 6. Fuera de alcance (planes futuros)

- Fase 2: `requireTenant()` en las 49 API routes + eliminar `supabase.from()` del
  frontend + **validación server-side de precios/totales** (brecha detectada en `/api/orders`).
- Fase 3: panel superadmin. Fase 4: registro/onboarding. Fase 5: branding y categorías
  por tenant. Fase 6: bot Telegram multitenant.

## 7. Riesgos específicos de estas fases

| Riesgo | Mitigación |
|---|---|
| Fase 0 rompe una pantalla que dependía del acceso abierto | Playwright + smoke antes de continuar a F1; rollback simple (políticas anteriores documentadas en la migración) |
| Backfill incompleto deja filas sin tenant | Queries de verificación dentro de `034` (conteos por tabla antes del NOT NULL) |
| RLS v2 con regresión de permisos para cajero/cocinero | Script de aislamiento incluye también asserts positivos (lo que SÍ deben poder hacer) |
| `app_settings` PK nueva rompe settings/printer/telegram | Cambios de código del paso 4 salen junto con `034`+`035` en el mismo deploy |
