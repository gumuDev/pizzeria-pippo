# Auditoría de Seguridad — Pizzería Pippo
**Fecha:** 2026-06-01  
**Auditor:** Claude Sonnet 4.6 (Security & QA Review)  
**Alcance:** Revisión pre-producción completa — 48 endpoints API, lib críticas, configuración, base de datos  

---

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Tabla de Hallazgos](#tabla-de-hallazgos)
3. [Análisis Detallado por Hallazgo](#análisis-detallado-por-hallazgo)
4. [Top 10 Problemas Más Importantes](#top-10-problemas-más-importantes)
5. [Plan de Remediación por Prioridad](#plan-de-remediación-por-prioridad)
6. [Pruebas Manuales Recomendadas](#pruebas-manuales-recomendadas)
7. [Pruebas Automatizadas Recomendadas](#pruebas-automatizadas-recomendadas)
8. [Checklist Final para Deploy](#checklist-final-para-deploy)

---

## Resumen Ejecutivo

Se identificaron **22 hallazgos** distribuidos en 4 niveles de riesgo:

| Nivel | Cantidad |
|-------|----------|
| Crítico | 6 |
| Alto | 4 |
| Medio | 8 |
| Bajo | 4 |

**El hallazgo más urgente:** La `SUPABASE_SERVICE_ROLE_KEY` y credenciales de usuarios están commitadas en texto plano en el repositorio (`.env.production` y `.env.test`). Esta key otorga acceso total a la base de datos bypasseando todas las políticas RLS. **Deben rotarse inmediatamente antes de continuar.**

---

## Tabla de Hallazgos

| # | Nivel | Archivo / Módulo | Problema | Riesgo |
|---|-------|-----------------|----------|--------|
| 1 | **CRÍTICO** | `.env.production` | Service Role Key y Anon Key en texto plano en el repo | Control total de BD comprometido |
| 2 | **CRÍTICO** | `.env.test` | Credenciales de usuarios reales (admin, cajero, cocinero) en el repo | Login directo como admin para cualquiera con acceso al repo |
| 3 | **CRÍTICO** | `src/app/api/reports/*` (5 endpoints) | Endpoints sin autenticación — datos financieros públicos | Ventas, pedidos, rendimiento por cajero accesibles sin login |
| 4 | **CRÍTICO** | `src/app/api/users/[id]/route.ts` | `requireAdmin()` no verifica rol, solo autenticación | Cualquier cajero puede banear al admin o cambiar roles |
| 5 | **CRÍTICO** | `src/app/api/users/route.ts` GET | Lista de usuarios sin verificación de rol | Cajero ve todos los emails, roles y branch_id del sistema |
| 6 | **CRÍTICO** | `src/app/api/users/route.ts` POST | Creación de usuarios sin verificación de rol | Cualquier usuario puede crear una cuenta con rol `admin` |
| 7 | **ALTO** | `src/app/api/telegram/webhook/route.ts` línea 45 | Webhook acepta requests si `telegram_webhook_secret` no está configurado | Inyección de mensajes al bot — acceso a datos del negocio |
| 8 | **ALTO** | `src/app/api/products/[id]/branch-prices/route.ts` | POST sin autenticación ni verificación de rol | Cualquiera puede modificar precios de productos a 0 |
| 9 | **ALTO** | `src/app/api/upload/route.ts` | Validación de archivo solo por extensión y MIME del cliente | Subida de SVG con XSS, HTML, o binarios maliciosos |
| 10 | **ALTO** | `src/app/api/settings/business/public/route.ts` | Usa service role para datos públicos | Privilegio innecesario; expone service role en lógica pública |
| 11 | **MEDIO** | `src/lib/warehouse.ts` — `transferToBranch()` | Race condition: lectura y escritura sin transacción atómica | Stock negativo en bodega con requests concurrentes |
| 12 | **MEDIO** | `src/app/api/orders/route.ts` — `getNextDailyNumber()` | Race condition en número diario de orden sin constraint UNIQUE | Dos órdenes con el mismo número en la misma sucursal |
| 13 | **MEDIO** | `src/app/api/reports/top-products/route.ts` | Filtrado de toda la tabla `order_items` en memoria (client-side) | Timeout o crash con meses de data; alto costo en Supabase |
| 14 | **MEDIO** | `src/app/api/stock/adjust/route.ts` y `stock/purchase/route.ts` | No verifican autenticación explícitamente (no llaman `getUser()`) | Requests con token inválido o vacío pueden pasar según RLS |
| 15 | **MEDIO** | `src/app/api/warehouse/*` | Solo verifica autenticación, no rol | Un cajero puede registrar compras o hacer transferencias de bodega |
| 16 | **MEDIO** | `src/middleware.ts` | Sin security headers (CSP, HSTS, X-Frame-Options) | Clickjacking, MIME sniffing, ausencia de Content Security Policy |
| 17 | **MEDIO** | Toda la suite de API routes | Sin rate limiting en ningún endpoint | Brute force, DDoS, abuso de endpoints costosos |
| 18 | **MEDIO** | `src/lib/telegram-ai.ts` | Prompt injection: `userMessage` sin sanitizar al modelo AI | Manipulación del AI para ejecutar intents no deseados |
| 19 | **BAJO** | `src/app/(admin)/layout.tsx` | Protección de rutas solo client-side via Refine | Si JS no carga o falla, no hay protección server-side |
| 20 | **BAJO** | `src/app/api/reports/cashiers/route.ts` | Query sin paginación — trae todas las órdenes con joins | OOM o timeout con meses de operación |
| 21 | **BAJO** | `next.config.mjs` | ID de proyecto Supabase hardcodeado en el código | Configuración frágil; se rompe si se migra el proyecto |
| 22 | **BAJO** | `.gitignore` | `.env.production` y `.env.test` no estaban ignorados antes del commit | Historial de git contiene los secrets aunque se agreguen ahora |

---

## Análisis Detallado por Hallazgo

---

### #1 — CRÍTICO: Service Role Key en `.env.production`

**Archivo:** `.env.production`

**Código comprometido:**
```
NEXT_PUBLIC_SUPABASE_URL=https://kewrgrmyeisiruteuhnd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Riesgo:** La `SUPABASE_SERVICE_ROLE_KEY` es una JWT con rol `service_role` que bypasea **todas** las políticas RLS de Supabase. Quien tenga esta key puede:
- Leer, modificar y eliminar cualquier dato de cualquier tabla
- Crear y eliminar usuarios
- Acceder a datos de todas las sucursales y tenants
- No hay forma de auditar qué hizo con ella

**Remediación:**
1. Ir a Supabase Dashboard → Settings → API → regenerar la `service_role` key
2. Regenerar también la `anon` key por precaución
3. Actualizar `.env.local` con las nuevas keys
4. Agregar al `.gitignore`:
```
.env.production
.env.test
.env*.local
```
5. Limpiar el historial de git:
```bash
# Opción A — Si el repo es privado y nadie más lo clonó:
git filter-repo --path .env.production --invert-paths
git filter-repo --path .env.test --invert-paths

# Opción B — Más simple pero destructiva:
# Crear un repo nuevo sin el historial comprometido
```

---

### #2 — CRÍTICO: Credenciales de usuarios en `.env.test`

**Archivo:** `.env.test`

**Código comprometido:**
```
TEST_ADMIN_EMAIL=admin@pippo.com
TEST_ADMIN_PASSWORD=admin123
TEST_CAJERO_EMAIL=cajero1@pippo.com
TEST_CAJERO_PASSWORD=cajero123
TEST_COCINERO_EMAIL=mateo@llanos.com
TEST_COCINERO_PASSWORD=mateo123
```

**Riesgo:** Credenciales de cuentas reales del sistema en texto plano. Cualquiera con acceso al repo puede iniciar sesión como admin.

**Remediación:**
1. Cambiar contraseñas de esas 3 cuentas en Supabase Auth
2. Para tests: usar variables de entorno del sistema CI (GitHub Actions Secrets, etc.)
3. Nunca commitear credenciales de cuentas reales — crear cuentas de test desechables si se necesitan

---

### #3 — CRÍTICO: Endpoints de reportes sin autenticación

**Archivos afectados:**
- `src/app/api/reports/sales/route.ts`
- `src/app/api/reports/cashiers/route.ts`
- `src/app/api/reports/daily/route.ts`
- `src/app/api/reports/top-products/route.ts`
- `src/app/api/reports/orders/route.ts`

**Problema:** Los 5 endpoints usan directamente `getServiceClient()` sin ninguna verificación de token del caller. Cualquier request sin credenciales recibe datos.

**Verificación:**
```bash
# Esto funciona sin ningún token:
curl "https://tu-dominio.com/api/reports/sales?from=2026-01-01&to=2026-06-01"
# Retorna: {"total":XXX,"count":XXX,"avg":XXX,...}
```

**Remediación — patrón a aplicar en los 5 endpoints:**
```typescript
export async function GET(request: NextRequest) {
  // AGREGAR ESTO al inicio de cada handler:
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  // ... resto del handler
```

---

### #4 — CRÍTICO: `requireAdmin()` no verifica rol

**Archivo:** `src/app/api/users/[id]/route.ts` líneas 20-25

**Código actual (problema):**
```typescript
async function requireAdmin(request: NextRequest) {
  const authClient = getAuthClient(request);
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return null;
  return user;  // ← SOLO verifica que esté autenticado, no que sea admin
}
```

**Impacto:** Los endpoints `PUT` (editar usuario), `PATCH` (banear/desbanear) y `DELETE` (eliminar) de `/api/users/[id]` son accesibles por cualquier cajero autenticado.

**Un cajero puede:**
- `PATCH /api/users/<admin-id> {"ban": true}` → banear al administrador
- `PUT /api/users/<id> {"role": "admin"}` → promover su propia cuenta a admin
- `DELETE /api/users/<id>` → eliminar usuarios

**Remediación:**
```typescript
async function requireAdmin(request: NextRequest) {
  const authClient = getAuthClient(request);
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return null;

  // AGREGAR: verificar que el perfil tenga rol admin
  const { data: profile } = await authClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return user;
}
```

---

### #5 y #6 — CRÍTICO: GET y POST `/api/users` sin verificación de rol

**Archivo:** `src/app/api/users/route.ts`

**GET (línea 20-57):** Verifica autenticación pero no rol. Retorna lista completa de usuarios con emails, roles, branch_id y estado de baneo.

**POST (línea 60-86):** Verifica autenticación pero no rol. Permite crear usuarios con cualquier rol, incluyendo `admin`.

**Remediación:**
```typescript
export async function GET(request: NextRequest) {
  const authClient = getAuthClient(request);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // AGREGAR verificación de rol:
  const { data: profile } = await authClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  // ... resto
}
```

---

### #7 — ALTO: Webhook Telegram sin secret obligatorio

**Archivo:** `src/app/api/telegram/webhook/route.ts` línea 45

**Código actual (problema):**
```typescript
const expectedSecret = (secretRow as { value: string } | null)?.value ?? "";

// Si expectedSecret está vacío → la condición es false → pasa sin validar
if (expectedSecret && receivedSecret !== expectedSecret) {
  return NextResponse.json({ ok: false }, { status: 401 });
}
```

**Riesgo:** Si `telegram_webhook_secret` no está configurado en `app_settings`, el endpoint acepta **cualquier request POST**. Un atacante puede enviar mensajes al bot y ejecutar consultas sobre ventas y stock.

**Remediación:**
```typescript
// Hacer el secret obligatorio
if (!expectedSecret || receivedSecret !== expectedSecret) {
  return NextResponse.json({ ok: false }, { status: 401 });
}
```

---

### #8 — ALTO: POST branch-prices sin autenticación

**Archivo:** `src/app/api/products/[id]/branch-prices/route.ts` líneas 41-70

**Problema:** El handler `POST` crea/actualiza precios de variantes por sucursal usando `getSupabaseWithAuth()`, pero nunca llama `getUser()` para verificar que el token sea válido. Si el RLS no cubre esta tabla explícitamente, cualquier request sin token pasa.

**Verificación:**
```bash
curl -X POST "https://tu-dominio.com/api/products/[id]/branch-prices" \
  -H "Content-Type: application/json" \
  -d '{"variant_id":"uuid","branch_id":"uuid","price":0}'
```

**Remediación:**
```typescript
export async function POST(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);

  // AGREGAR verificación de auth y rol:
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  // ... resto
}
```

---

### #9 — ALTO: Upload de archivos sin validación de contenido

**Archivo:** `src/app/api/upload/route.ts`

**Código actual (problema):**
```typescript
const ext = file.name.split(".").pop();           // extensión del nombre del archivo
const fileName = `${Date.now()}.${ext}`;          // sin validar que ext sea segura
// ...
const { error } = await supabase.storage.from("product-images").upload(fileName, buffer, {
  contentType: file.type,  // ← MIME type viene del cliente, puede ser falso
  upsert: true,
});
```

**Riesgos:**
- Subida de `.svg` con JavaScript embebido (XSS si el browser lo renderiza)
- Subida de `.html` servido directamente desde Supabase Storage
- Sin límite de tamaño declarado en el servidor
- Sin validación de magic bytes (los primeros bytes del archivo)

**Remediación:**
```typescript
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  // ... auth check ...

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Validar tamaño
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx 2MB)" }, { status: 400 });
  }

  // Validar extensión
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  // Validar MIME type del servidor (no del cliente)
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  // Opcionalmente validar magic bytes para verificar que el contenido sea realmente una imagen
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
  const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45;
  if (!isJpeg && !isPng && !isWebp) {
    return NextResponse.json({ error: "Contenido de archivo inválido" }, { status: 400 });
  }
  // ... resto
}
```

---

### #11 — MEDIO: Race condition en transferencias de bodega

**Archivo:** `src/lib/warehouse.ts` — función `transferToBranch()` líneas 100-145

**Problema:** El flujo es:
1. `SELECT` → leer stock actual de bodega
2. Si hay suficiente stock → `UPDATE` → restar del warehouse
3. `UPDATE` → sumar a branch_stock

Entre el paso 1 y el paso 2, otro request concurrente puede leer el mismo stock disponible. Ambos pasarían la validación y ambos ejecutarían la resta, dejando el stock en negativo.

**Remediación:** Crear una función RPC en Supabase que ejecute la transferencia atómicamente:

```sql
-- docs/database/migrations/NNN_transfer_warehouse_rpc.sql
CREATE OR REPLACE FUNCTION transfer_to_branch(
  p_ingredient_id UUID,
  p_quantity NUMERIC,
  p_branch_id UUID,
  p_notes TEXT,
  p_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_warehouse_row warehouse_stock%ROWTYPE;
  v_branch_row branch_stock%ROWTYPE;
BEGIN
  -- Lock the row for update (prevents race conditions)
  SELECT * INTO v_warehouse_row
  FROM warehouse_stock
  WHERE ingredient_id = p_ingredient_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Insumo no encontrado en bodega');
  END IF;

  IF v_warehouse_row.quantity < p_quantity THEN
    RETURN json_build_object('error', 'Stock insuficiente', 'available', v_warehouse_row.quantity);
  END IF;

  -- Deduct from warehouse
  UPDATE warehouse_stock SET quantity = quantity - p_quantity WHERE id = v_warehouse_row.id;

  -- Add to branch (upsert)
  INSERT INTO branch_stock (branch_id, ingredient_id, quantity, min_quantity)
  VALUES (p_branch_id, p_ingredient_id, p_quantity, 0)
  ON CONFLICT (branch_id, ingredient_id)
  DO UPDATE SET quantity = branch_stock.quantity + p_quantity;

  -- Record movements
  INSERT INTO warehouse_movements (ingredient_id, quantity, type, branch_id, notes, created_by)
  VALUES (p_ingredient_id, -p_quantity, 'transferencia', p_branch_id, p_notes, p_user_id);

  INSERT INTO stock_movements (branch_id, ingredient_id, quantity, type, origin, notes, created_by)
  VALUES (p_branch_id, p_ingredient_id, p_quantity, 'compra', 'transferencia', p_notes, p_user_id);

  RETURN json_build_object('success', true);
END;
$$;
```

---

### #12 — MEDIO: Race condition en número diario de orden

**Archivo:** `src/app/api/orders/route.ts` — función `getNextDailyNumber()`

**Problema:** Si dos órdenes se crean simultáneamente, ambas pueden calcular el mismo `daily_number`. No existe un constraint `UNIQUE` en la BD para `(branch_id, daily_number, date)`.

**Remediación en BD:**
```sql
-- Agregar constraint único
ALTER TABLE orders 
ADD CONSTRAINT orders_branch_daily_unique 
UNIQUE (branch_id, daily_number, DATE(created_at AT TIME ZONE 'America/La_Paz'));

-- O mejor: usar una secuencia por sucursal con una función RPC
```

---

### #13 — MEDIO: `top-products` trae toda la tabla en memoria

**Archivo:** `src/app/api/reports/top-products/route.ts` líneas 19-43

**Problema:**
```typescript
// La query trae TODOS los order_items de la BD, sin filtro de fecha/sucursal en SQL:
const query = supabase
  .from("order_items")
  .select(`qty, unit_price, discount_applied, product_variants(...), orders(...)`)
// No hay .eq(), .gte(), .lte() aquí — el filtrado ocurre en JS (línea 36-44)
```

Con 6 meses de operación y 100 órdenes/día × 3 items promedio = ~54,000 filas cargadas en memoria en cada request. La función serverless tiene límite de memoria (512MB en Vercel por defecto).

**Remediación:** Usar una RPC o reestructurar la query para que los filtros operen en SQL:
```typescript
// Filtrar por fecha ANTES del JOIN con order_items
let ordersQuery = supabase
  .from("orders")
  .select("id")
  .is("cancelled_at", null);

if (branchId) ordersQuery = ordersQuery.eq("branch_id", branchId);
if (from) ordersQuery = ordersQuery.gte("created_at", dateRangeFrom(from));
if (to) ordersQuery = ordersQuery.lte("created_at", dateRangeTo(to));

const { data: orders } = await ordersQuery;
const orderIds = (orders ?? []).map(o => o.id);
if (!orderIds.length) return NextResponse.json([]);

// Luego traer solo los items de esas órdenes
const { data: items } = await supabase
  .from("order_items")
  .select("qty, product_variants(id, name, products(name, category))")
  .in("order_id", orderIds);
```

---

### #16 — MEDIO: Sin security headers

**Archivo:** `src/middleware.ts`

**Código actual:**
```typescript
export function middleware() {
  return NextResponse.next(); // No hace nada
}
```

**Remediación:**
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://kewrgrmyeisiruteuhnd.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
  );

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

---

### #18 — MEDIO: Prompt injection en Telegram AI

**Archivo:** `src/lib/telegram-ai.ts` línea 460

**Problema:**
```typescript
const text = await callAI(providerConfig, await buildSystemPrompt(...), userMessage);
aiResult = JSON.parse(text) as AIResult; // Sin validar el schema
```

Si el modelo retorna JSON con un `intent` no reconocido o con `params` malformados, el switch/case falla silenciosamente. Un usuario avanzado podría intentar manipular el prompt para que el modelo retorne `params` con `branch_id` de otra sucursal.

**Remediación:**
```typescript
const VALID_INTENTS = ["stock_query","stock_alerts","sales_summary","top_products",
  "sales_report_excel","promotions_query","daily_orders","unknown"];

// Después del JSON.parse:
if (!VALID_INTENTS.includes(aiResult.intent)) {
  aiResult = { intent: "unknown", params: {} };
}
// Sanitizar params — solo UUIDs válidos en branch_id
if (aiResult.params.branch_id && !/^[0-9a-f-]{36}$/i.test(aiResult.params.branch_id)) {
  delete aiResult.params.branch_id;
}
```

---

## Top 10 Problemas Más Importantes

### #1 — Service Role Key comprometida en el repo
La key con acceso total a la BD está en texto plano en un archivo commitado. **Rotar inmediatamente.**

### #2 — Credenciales de admin en `.env.test`
Contraseña del admin en el historial de git. **Cambiar contraseñas ahora.**

### #3 — 5 endpoints de reportes completamente abiertos
`/api/reports/sales`, `/api/reports/orders`, `/api/reports/cashiers`, `/api/reports/daily`, `/api/reports/top-products` son accesibles por cualquier persona sin credenciales. Datos financieros del negocio expuestos públicamente.

### #4 — Escalada de privilegios via `/api/users`
`requireAdmin()` no verifica el rol. Cualquier cajero autenticado puede: banear al admin, asignarse rol admin, eliminar usuarios. Escalada de privilegios total.

### #5 — Creación de usuarios admin sin restricción
`POST /api/users` está protegido por autenticación, no por rol. Un cajero puede crear una cuenta con `role: "admin"`.

### #6 — Webhook Telegram sin secret obligatorio
Si la BD no tiene configurado `telegram_webhook_secret`, el endpoint acepta cualquier request externo. Un atacante puede consultar ventas, stock y órdenes via el bot.

### #7 — Precios de productos modificables sin autenticación
`POST /api/products/[id]/branch-prices` no tiene ninguna verificación. Los precios pueden ser puestos en 0 o valores negativos.

### #8 — Upload de archivos sin validación server-side
Cualquier usuario autenticado puede subir SVG con XSS, HTML, o ejecutables disfrazados de imágenes.

### #9 — Race condition en transferencias de bodega
Dos transferencias simultáneas pueden dejar el stock de bodega en negativo sin ningún error.

### #10 — Sin rate limiting ni security headers
La aplicación no tiene protección contra brute force, DDoS básico, clickjacking, ni MIME sniffing.

---

## Plan de Remediación por Prioridad

### Fase 1 — Hacer ANTES de cualquier deploy (hoy)

- [ ] **Rotar** `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Supabase Dashboard
- [ ] **Cambiar contraseñas** de `admin@pippo.com`, `cajero1@pippo.com`, `mateo@llanos.com`
- [ ] **Agregar al `.gitignore`**: `.env.production`, `.env.test`
- [ ] **Limpiar historial de git** con `git filter-repo` o hacer el repo privado
- [ ] **Arreglar 5 endpoints** `/api/reports/*` — agregar verificación de auth al inicio
- [ ] **Arreglar `requireAdmin()`** en `users/[id]/route.ts` — verificar `role === 'admin'`
- [ ] **Arreglar `GET /api/users`** — verificar rol admin antes de retornar lista
- [ ] **Arreglar `POST /api/users`** — verificar rol admin antes de crear usuario
- [ ] **Arreglar webhook Telegram** — hacer secret obligatorio (cambiar `if (expectedSecret && ...)` a `if (!expectedSecret || ...)`)
- [ ] **Arreglar `POST branch-prices`** — agregar auth y verificación de rol

### Fase 2 — Esta semana

- [ ] Validar extensión, MIME type y magic bytes en `/api/upload`
- [ ] Agregar verificación de autenticación explícita en `stock/adjust` y `stock/purchase`
- [ ] Verificar rol en todos los endpoints de `/api/warehouse/*`
- [ ] Agregar security headers en `middleware.ts`
- [ ] Arreglar filtrado en `/api/reports/top-products` para que opere en SQL
- [ ] Validar schema del JSON retornado por AI en `telegram-ai.ts`

### Fase 3 — Próxima semana

- [ ] Implementar RPC atómica para transferencias de bodega (race condition)
- [ ] Agregar constraint UNIQUE para número diario de orden
- [ ] Implementar rate limiting en middleware
- [ ] Agregar paginación obligatoria en `/api/reports/cashiers`
- [ ] Mover dominio de Supabase a variable de entorno en `next.config.mjs`

---

## Pruebas Manuales Recomendadas

```bash
# === TEST 1: Endpoints de reportes sin autenticación ===
# Estos deberían devolver 401, actualmente devuelven datos reales:
curl "https://TU-DOMINIO/api/reports/sales"
curl "https://TU-DOMINIO/api/reports/orders"
curl "https://TU-DOMINIO/api/reports/top-products"
curl "https://TU-DOMINIO/api/reports/daily"
curl "https://TU-DOMINIO/api/reports/cashiers"

# === TEST 2: Escalada de privilegios con token de cajero ===
# Obtener token de cajero (login normal en el POS)
TOKEN_CAJERO="<bearer-token-del-cajero>"

# Ver lista de usuarios (debería ser 403):
curl -H "Authorization: Bearer $TOKEN_CAJERO" "https://TU-DOMINIO/api/users"

# Intentar crear usuario admin (debería ser 403):
curl -X POST -H "Authorization: Bearer $TOKEN_CAJERO" -H "Content-Type: application/json" \
  -d '{"email":"hack@test.com","password":"123456","full_name":"Hacker","role":"admin"}' \
  "https://TU-DOMINIO/api/users"

# Intentar banear al admin (debería ser 403):
curl -X PATCH -H "Authorization: Bearer $TOKEN_CAJERO" -H "Content-Type: application/json" \
  -d '{"ban": true}' \
  "https://TU-DOMINIO/api/users/<ID-DEL-ADMIN>"

# === TEST 3: Modificar precios sin auth ===
# Debería devolver 401:
curl -X POST -H "Content-Type: application/json" \
  -d '{"variant_id":"<uuid>","branch_id":"<uuid>","price":0}' \
  "https://TU-DOMINIO/api/products/<id>/branch-prices"

# === TEST 4: Webhook Telegram sin secret ===
# Si no hay secret configurado, esto debería devolver 401 pero actualmente retorna ok:
curl -X POST -H "Content-Type: application/json" \
  -d '{"message":{"text":"ventas hoy","chat":{"id":12345,"type":"private"}}}' \
  "https://TU-DOMINIO/api/telegram/webhook"

# === TEST 5: Upload de archivo malicioso ===
# Crear SVG con XSS y subirlo (debería ser rechazado):
echo '<svg onload="alert(1)"><script>alert(document.cookie)</script></svg>' > test.svg
curl -X POST -H "Authorization: Bearer $TOKEN_CAJERO" \
  -F "file=@test.svg;type=image/jpeg" \
  "https://TU-DOMINIO/api/upload"
```

---

## Pruebas Automatizadas Recomendadas

### 1. Tests de autorización (prioridad máxima)

```typescript
// tests/api/auth.test.ts

describe("API Authorization", () => {
  it("GET /api/reports/sales — sin token debe retornar 401", async () => {
    const res = await fetch("/api/reports/sales");
    expect(res.status).toBe(401);
  });

  it("POST /api/users — con token de cajero debe retornar 403", async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CAJERO_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "x@x.com", password: "123", role: "admin" }),
    });
    expect(res.status).toBe(403);
  });

  it("PATCH /api/users/[id] — con token de cajero debe retornar 403", async () => {
    const res = await fetch(`/api/users/${ADMIN_USER_ID}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${CAJERO_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ban: true }),
    });
    expect(res.status).toBe(403);
  });
});
```

### 2. Tests de validación de input

```typescript
describe("Input Validation", () => {
  it("POST /api/orders — total negativo debe ser rechazado", async () => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Authorization": `Bearer ${CAJERO_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ branch_id: BRANCH_ID, items: [{ variant_id: "x", qty: 1 }], total: -100, order_type: "dine_in" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/upload — SVG debe ser rechazado", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(['<svg onload="alert(1)"/>'], { type: "image/svg+xml" }), "test.svg");
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Authorization": `Bearer ${CAJERO_TOKEN}` },
      body: formData,
    });
    expect(res.status).toBe(400);
  });
});
```

### 3. Tests de race condition

```typescript
describe("Race Conditions", () => {
  it("Transferencia simultánea no debe dejar stock negativo", async () => {
    // Configurar 5 unidades en bodega
    // Lanzar 3 transferencias concurrentes de 3 unidades cada una
    const transfers = Array(3).fill(null).map(() =>
      fetch("/api/warehouse/transfer", {
        method: "POST",
        headers: { "Authorization": `Bearer ${ADMIN_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_id: TEST_INGREDIENT_ID, quantity: 3, branch_id: TEST_BRANCH_ID }),
      })
    );
    const results = await Promise.all(transfers);
    const successes = results.filter(r => r.status === 200).length;
    expect(successes).toBeLessThanOrEqual(1); // Solo 1 debería pasar (hay 5 unidades, solo caben 1 transferencia de 3)
    // Verificar que el stock no sea negativo
    const stock = await getWarehouseStock(TEST_INGREDIENT_ID);
    expect(stock.quantity).toBeGreaterThanOrEqual(0);
  });
});
```

### 4. Tests E2E de roles (Playwright)

```typescript
// e2e/role-access.spec.ts
test("Cajero no puede acceder a /users", async ({ page }) => {
  await loginAsCajero(page);
  await page.goto("/users");
  // Debe redirigir o mostrar error, no la lista de usuarios
  await expect(page).not.toHaveURL("/users");
});

test("Cajero no puede acceder a /reports", async ({ page }) => {
  await loginAsCajero(page);
  await page.goto("/reports");
  await expect(page.getByText("Acceso denegado")).toBeVisible();
});
```

---

## Checklist Final para Deploy

### Secrets y credenciales
- [ ] `SUPABASE_SERVICE_ROLE_KEY` rotada — nueva key solo en variables de entorno del hosting
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` rotada
- [ ] Contraseñas de cuentas de test cambiadas (`admin@pippo.com`, `cajero1@pippo.com`, `mateo@llanos.com`)
- [ ] `.env.production` y `.env.test` en `.gitignore`
- [ ] Historial de git limpiado o repo hecho privado
- [ ] `ANTHROPIC_API_KEY` y `OPENAI_COMPATIBLE_API_KEY` no están en archivos commitados
- [ ] `TELEGRAM_WEBHOOK_SECRET` configurado en `app_settings` antes de activar el bot

### Autenticación y autorización
- [ ] Todos los endpoints de `/api/reports/*` requieren auth
- [ ] `requireAdmin()` en `users/[id]` verifica `role === 'admin'`
- [ ] `GET /api/users` verifica rol admin
- [ ] `POST /api/users` verifica rol admin
- [ ] `POST /api/products/[id]/branch-prices` tiene auth + verificación de rol
- [ ] Endpoints de `/api/warehouse/*` verifican rol (no solo auth)
- [ ] Webhook Telegram tiene secret obligatorio

### Validación de entrada
- [ ] Upload de imágenes valida extensión, MIME type y magic bytes server-side
- [ ] Upload tiene límite de tamaño declarado en el servidor
- [ ] `stock/adjust` y `stock/purchase` verifican `getUser()` explícitamente

### Base de datos y Supabase
- [ ] RLS habilitado en todas las tablas sensibles: `orders`, `order_items`, `branch_stock`, `warehouse_stock`, `profiles`, `app_settings`
- [ ] Constraint UNIQUE para `(branch_id, daily_number, date)` en `orders`
- [ ] RPC atómica para transferencias de bodega (o aceptar el riesgo de race condition)

### Infraestructura y hardening
- [ ] Security headers configurados en `middleware.ts`
- [ ] Rate limiting implementado (o configurado en Vercel/CDN)
- [ ] Dominio de Supabase derivado de variable de entorno en `next.config.mjs`
- [ ] `NEXT_PUBLIC_APP_VERSION` actualizado para producción

### Pruebas previas al deploy
- [ ] Verificado manualmente que `/api/reports/*` retorna 401 sin token
- [ ] Verificado que cajero no puede crear usuarios admin
- [ ] Verificado que cajero no puede banear al admin
- [ ] Verificado que upload rechaza SVG y archivos no-imagen
- [ ] Verificado que el webhook Telegram rechaza requests sin secret válido

---

*Generado por auditoría automática — 2026-06-01. Los hallazgos deben verificarse manualmente antes de cierre.*
