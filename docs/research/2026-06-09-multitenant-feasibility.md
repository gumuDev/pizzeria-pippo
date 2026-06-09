# Investigación: Viabilidad de Multitenant (SaaS de comercios)

**Fecha:** 2026-06-09
**Rama:** `feature/multitenant`
**Estado:** Investigación — no es el plan de implementación
**Veredicto anticipado:** ✅ **Viable**, con pre-requisitos de seguridad y un esfuerzo significativo pero por fases.

---

## 1. Visión del feature

- La plataforma deja de ser una app de una sola pizzería y se convierte en un **SaaS
  donde varios comercios gastronómicos se registran** (pizzería primero; hamburguesería
  y otros rubros después).
- Cada comercio (tenant) tiene **su propio panel de administración** idéntico al actual:
  productos, variantes, sucursales, usuarios, inventario, promociones, órdenes, reportes
  y configuraciones — completamente aislado de los demás.
- Aparece un **superadmin de plataforma** con panel propio para ver y administrar los
  comercios registrados.

---

## 2. Radiografía de la arquitectura actual

### 2.1 Aplicaciones dentro del monorepo Next.js

| App | Ruta | Usuarios | Estado actual |
|---|---|---|---|
| Panel admin (Refine + AntD) | `(admin)/*` — 11 secciones | rol `admin` | Single-tenant |
| POS (Tailwind) | `(pos)/pos` | `cajero`, `admin` | Por sucursal |
| Cocina | `/kitchen` | `cocinero` | Por sucursal |
| Display cliente | `/display` | público (pantalla) | Por sucursal vía BroadcastChannel |
| Login | `/login` | todos | Redirige por rol |
| API interna | `/api/*` — **49 routes** | backend | Valida JWT + service role |
| Bot Telegram IA | `/api/telegram/webhook` | externo | Token único global |

### 2.2 Modelo de datos (23 tablas, sin concepto de tenant)

La raíz implícita de agrupación hoy es `branches` (sucursal). No existe ninguna entidad
"comercio/negocio" por encima. Jerarquía actual:

```
(nada) ── branches ──┬── branch_prices, branch_stock, branch_product_stock
                     ├── orders ── order_items ── order_item_flavors
                     └── profiles.branch_id (cajero/cocinero asignado)
(nada) ── products ── product_variants ── recipes
(nada) ── ingredients, variant_types, promotions(→branch opcional), warehouse_*
(nada) ── app_settings (key-value GLOBAL), telegram_* (GLOBAL)
```

Hallazgos relevantes para multitenant:

1. **Ninguna tabla tiene `tenant_id`.** Todas las tablas "raíz" (`branches`, `products`,
   `ingredients`, `variant_types`, `promotions`, `warehouse_stock`, `app_settings`,
   `profiles`, `telegram_*`) asumen un único negocio.
2. **`app_settings` tiene PK = `key`** — un solo juego de configuraciones para toda la
   plataforma (Telegram, cocina, impresora). En multitenant debe ser PK compuesta
   `(tenant_id, key)` o tabla por dominio.
3. **Constraints únicos globales que chocan entre tenants:**
   - `variant_types.name UNIQUE` → dos comercios no podrían tener "Familiar".
   - `telegram_authorized_chats.chat_id UNIQUE` → ok si el chat pertenece a un tenant, pero la tabla no sabe a cuál.
4. **El rubro está cableado en la BD:** `products.category` y `promotion_rules.category`
   tienen `CHECK (category IN ('pizza','bebida','otro'))`. Para servir a una
   hamburguesería, las categorías deben volverse **datos por tenant**, no constraints.
5. **`orders.daily_number`** se calcula como max+1 **por sucursal y día** (en
   `/api/orders`), así que es naturalmente compatible con multitenant (la sucursal ya
   pertenecerá a un tenant).
6. `idempotency_key` único global — compatible (es un UUID generado por cliente).

### 2.3 Auth y roles

- Supabase Auth + tabla `profiles` (`id = auth.uid()`).
- **Roles con CHECK:** `admin | cajero | cocinero`. No existe `superadmin`.
- Trigger `handle_new_user` crea el profile desde `raw_user_meta_data` (default `cajero`).
- Helpers SQL `SECURITY DEFINER`: `get_user_role()`, `get_user_branch_id()` — patrón
  perfecto para añadir un futuro `get_user_tenant_id()`.
- `authProvider` de Refine consulta `profiles.role`; login redirige por rol.
- `lib/auth.ts` centraliza `getToken()` (una sola puerta al token — facilita cambios).

### 2.4 Acceso a datos — dos vías coexistentes

1. **API routes (49):** validan el Bearer token con el anon client (`auth.getUser()`),
   verifican rol, y operan con **service role key** (bypassa RLS). El aislamiento por
   tenant aquí dependerá 100% de que **cada route filtre por tenant** — el service role
   no perdona descuidos.
2. **Services del frontend con `supabase.from()` directo** (POS, products, promotions,
   ingredients, stock, warehouse, reports). Aquí el aislamiento depende 100% de **RLS**.

> Implicación: la estrategia multitenant debe cubrir **ambas vías a la vez** — RLS
> estricta para los queries directos, y un helper obligatorio de tenant en las API routes.

### 2.5 RLS actual — el hallazgo más crítico ⚠️

78 políticas con **tres patrones inconsistentes**:

| Patrón | Ejemplos | Problema en multitenant |
|---|---|---|
| `get_user_role() = 'admin'` | mayoría de tablas | Cualquier admin de **cualquier** tenant pasaría — necesita además tenant match |
| `auth.jwt() -> user_metadata ->> 'role'` | `variant_types` | Metadata manipulable por el propio usuario en algunos flujos — ya es un riesgo hoy |
| `USING (true)` / rol `anon` | `products_select_all`, `ingredients_select_all`, `branch_prices_select_all`, `order_item_flavors_*`, **`anon_full_access_variant_types`** | **Fuga total entre tenants**: cualquier usuario (incluso anónimo en variant_types) leería los datos de todos los comercios |

**Conclusión:** la RLS actual fue diseñada para un negocio único y es **incompatible**
con multitenant tal como está. Reescribirla no es opcional — es el pre-requisito #1.
(Nota: ya existe `032_fix_rls_security_warnings.sql` en PENDING.md, señal de que el
endurecimiento ya estaba en el radar.)

### 2.6 Realtime, storage, branding y bot

- **Realtime:** canales con nombre global (`kitchen-orders`, `pos-kitchen-status`) pero
  con `filter: branch_id=eq.X` en `postgres_changes`. Supabase Realtime **respeta RLS**
  para postgres_changes, así que con RLS por tenant el filtrado queda cubierto; los
  nombres de canal conviene namespacearlos por sucursal/tenant igualmente.
- **Storage:** bucket único `product-images`, sin namespace por tenant en los paths.
  Riesgo bajo (URLs públicas no enumerables) pero conviene prefijar `tenant_id/`.
- **Branding hardcoded en ~11 archivos:** "Pippo" aparece en `layout.tsx` (metadata),
  `manifest.json` (PWA), login, POS header, kitchen, display, notificaciones, ticket de
  impresión (`TICKET_BUSINESS_NAME`) y el prompt del bot IA. En multitenant el nombre,
  logo y colores deben salir de la tabla `tenants`.
- **Bot Telegram:** un solo token global en `app_settings` y webhook único. Multitenant
  real del bot = token por tenant o un bot compartido que resuelva el tenant por chat —
  decisión de producto pendiente.
- **PWA:** `manifest.json` estático con nombre/íconos de Pippo. Para branding por tenant
  se necesitaría manifest dinámico (route handler) — no bloqueante para el MVP.

### 2.7 Lo que juega a favor ✅

1. **Arquitectura feature-based estricta** (components/hooks/services/types) — los
   cambios de queries se concentran en los services, no regados por la UI.
2. **`getToken()` y helpers SQL centralizados** — un solo lugar para inyectar contexto de tenant.
3. **49 API routes con un patrón uniforme** (validar JWT → service role) — se puede
   extraer un `withTenant()` helper y migrarlas mecánicamente.
4. **`daily_number`, stock y reportes ya están scoped por sucursal** — al colgar
   `branches` de `tenants`, gran parte del dominio hereda el aislamiento.
5. **El admin ya restringe todo por rol** — agregar la dimensión tenant no cambia la UX
   del panel del comercio (objetivo: que el admin actual no note diferencia).
6. **i18n (next-intl) ya instalado** — el texto por vertical (pizza → hamburguesa) tiene
   dónde vivir.
7. **Convención de migraciones documentadas** (`docs/database/migrations/`) — el cambio
   de schema grande tiene proceso establecido.

---

## 3. Análisis de brechas (gap analysis)

| # | Brecha | Severidad | Área |
|---|---|---|---|
| G1 | No existe tabla `tenants` ni `tenant_id` en ninguna tabla | Bloqueante | BD |
| G2 | Políticas RLS abiertas (`USING true`, `anon`) — fuga entre tenants | Bloqueante (seguridad) | BD |
| G3 | No existe rol `superadmin` (CHECK en `profiles.role`) | Bloqueante | Auth |
| G4 | `app_settings` global (PK `key`) | Alta | BD |
| G5 | API routes con service role sin noción de tenant (49 archivos) | Alta | Backend |
| G6 | Categorías de producto cableadas al rubro pizzería (CHECK en BD) | Alta | BD/Producto |
| G7 | No existe flujo de registro/onboarding de comercios (signup crea `cajero`) | Alta | Producto |
| G8 | No existe panel superadmin | Alta | Frontend |
| G9 | Branding "Pippo" hardcoded (11 archivos, manifest, ticket, bot) | Media | Frontend |
| G10 | `variant_types.name` UNIQUE global y similares | Media | BD |
| G11 | Canales realtime con nombre global | Media | Backend |
| G12 | Bot Telegram single-tenant (token/webhook único) | Media | Producto |
| G13 | Storage sin namespace por tenant | Baja | Backend |
| G14 | PWA manifest estático | Baja | Frontend |

---

## 4. Estrategia recomendada (alto nivel)

**Modelo de aislamiento: una sola BD con columna `tenant_id` + RLS estricta.**
Es el estándar para SaaS sobre Supabase, compatible con la infraestructura actual
(Vercel + Supabase), sin costo por tenant, y la migración es incremental. Schema-por-tenant
o proyecto-por-tenant quedan descartados por complejidad operativa para esta escala.

Diseño base:

```
tenants (id, name, slug, business_type, logo_url, status, plan, created_at)
   ├── branches.tenant_id          ├── ingredients.tenant_id
   ├── products.tenant_id          ├── variant_types.tenant_id
   ├── promotions.tenant_id        ├── warehouse_*.tenant_id
   ├── profiles.tenant_id (NULL para superadmin)
   ├── app_settings → PK (tenant_id, key)
   └── product_categories (nueva, reemplaza el CHECK de category)
```

- Tablas "hijas" (`order_items`, `recipes`, `branch_prices`, etc.) heredan el tenant por
  FK — pueden llevar `tenant_id` desnormalizado solo si la RLS lo amerita por performance.
- Helper SQL `get_user_tenant_id()` + reescritura completa de RLS: toda política combina
  **rol + tenant**.
- Rol nuevo `superadmin` (con `tenant_id NULL`) y políticas que le permitan SELECT
  agregado sobre tenants.
- **Pippo se migra como tenant #1** vía backfill en la migración.
- En API routes: helper `requireTenant(req)` que resuelve `tenant_id` desde el profile
  del JWT y lo inyecta en cada query con service role.

### Fases sugeridas (cada una será su propio feature plan)

| Fase | Contenido | Tamaño |
|---|---|---|
| 0 | **Endurecer RLS actual** (cerrar `USING true` y `anon`) — vale la pena incluso sin multitenant | S |
| 1 | Schema: tabla `tenants`, `tenant_id` en tablas raíz, backfill Pippo, helpers SQL, RLS v2 | L |
| 2 | Backend: `requireTenant()` en las 49 API routes + services del frontend | L |
| 3 | Superadmin: rol, login, panel básico (lista de comercios, estado, métricas simples) | M |
| 4 | Onboarding: registro de comercio (alta de tenant + primer admin) | M |
| 5 | Branding por tenant (nombre/logo en UI, ticket, manifest dinámico) + categorías por tenant | M |
| 6 | Bot Telegram multitenant (decisión de producto pendiente) | M |

### Riesgos principales

1. **Migración de datos en producción** — backfill de `tenant_id` con la app viva;
   mitigación: columnas nullable primero, backfill, luego NOT NULL + RLS en una ventana.
2. **Una política RLS olvidada = fuga de datos entre comercios** — mitigación: test
   automatizado de aislamiento (dos tenants de prueba, asserts cruzados) antes de abrir
   el registro.
3. **Las 49 API routes usan service role** — un `.eq("tenant_id", ...)` olvidado bypassa
   todo; mitigación: helper único obligatorio + revisión route por route.
4. **Regresión funcional para Pippo** — el negocio actual no puede romperse; mitigación:
   suite Playwright existente corriendo contra el tenant 1 en cada fase.

---

## 5. Preguntas abiertas (decidir antes del plan de la Fase 1)

1. **Acceso:** ¿mismo dominio con tenant resuelto por login, o subdominio por comercio?
   (la investigación recomienda empezar por login y dejar subdominios para después).
2. **Registro:** ¿self-service abierto, o el superadmin aprueba/crea los comercios?
3. **Planes/billing:** ¿los tenants tendrán planes de pago desde el MVP o después?
4. **Bot Telegram e impresora:** ¿features incluidos para todos los tenants o por plan?
5. **Verticales:** ¿solo categorías configurables, o también terminología de UI por rubro?

---

## 6. Conclusión

**Sí se puede aplicar multitenant a este proyecto.** La arquitectura feature-based, el
patrón uniforme de API routes, los helpers de auth centralizados y el scoping por
sucursal ya existente son una base sólida. Los bloqueantes reales son tres y todos
tienen solución conocida: (1) introducir `tenants` + `tenant_id` con backfill de Pippo,
(2) reescribir la RLS — que hoy tiene políticas abiertas incompatibles con aislamiento —
y (3) crear el rol y panel de superadmin. El esfuerzo total es grande pero **perfectamente
divisible en 6-7 fases independientes**, cada una con su plan, sus migraciones
documentadas y sus tests, sin interrumpir la operación actual de la pizzería.
