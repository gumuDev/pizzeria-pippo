# Estado del Proyecto — Pizzería Pippo

> Última actualización: 2026-03-03

---

## Resumen general

Sistema full-stack de gestión para restaurante de pizza con múltiples sucursales.
- **Frontend/Backend:** Next.js 14 App Router + TypeScript
- **Admin panel:** Refine + Ant Design
- **POS / Display:** Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL + Auth + Storage)
- **i18n:** next-intl (español default, inglés disponible)
- **PWA:** next-pwa

---

## Estado de módulos

| # | Módulo | Estado | Notas |
|---|--------|--------|-------|
| 01 | Project Setup | ✅ Completo | next-pwa, manifest, i18n, estructura de rutas |
| 02 | Base de datos | ✅ Completo | Schema completo, RLS configurado |
| 03 | Auth | ✅ Completo | Roles: admin / cajero / cocinero, middleware, redirect automático |
| 04 | Insumos | ✅ Completo | CRUD con soft delete, alertas de stock bajo |
| 05 | Productos | ✅ Completo | 3 pasos: datos + variantes + receta, imágenes en Storage |
| 06 | Inventario/Stock | ✅ Completo | Compras, ajustes, historial de movimientos |
| 07 | Promociones | ✅ Completo | BUY_X_GET_Y, PERCENTAGE, COMBO |
| 08 | POS | ✅ Completo | Catálogo, carrito, promos automáticas, ticket, panel "Pedidos del día" |
| 09 | Display cliente | ✅ Completo | BroadcastChannel, modos: menú / pedido / gracias |
| 10 | Reportes | ✅ Completo | General, historial de ventas, por cajero |
| — | Usuarios | ✅ Completo | CRUD cajeros y cocineros desde panel admin |
| 12 | KDS (Cocina) | ✅ Completo | Pantalla cocina con Realtime, timer de demora, rol cocinero |
| — | Sucursales | ✅ Completo | Soft delete, protección si hay cajeros activos |
| 11 | PWA | ⚠️ Parcial | Íconos y manifest listos. Falta: generar PNGs reales en `public/icons/` |

---

## Funcionalidades implementadas

### Panel Admin (`/`)

#### Dashboard
- KPIs: ventas del día, órdenes, ticket promedio, alertas de stock
- Gráfico de línea: ventas últimos 7 días
- Top 5 productos más vendidos
- Cards de insumos bajo mínimo con link a stock

#### Productos (`/products`)
- Tabla con imagen, categoría (emoji), variantes y estado activo/inactivo
- Formulario 3 pasos: datos generales → variantes y precios → receta por variante
- Subida de imagen via `/api/upload` (service role, bypassa RLS de Storage)
- Soft delete con toggle activo/inactivo
- Página de detalle por producto (`/products/[id]`)

#### Insumos (`/ingredients`)
- CRUD completo con unidad de medida (g, ml, unidad)
- Soft delete con protección: no se puede desactivar si tiene recetas activas

#### Inventario (`/stock`)
- 4 tabs: Stock actual | Compras | Ajuste manual | Historial de movimientos
- Stock actual por sucursal con indicador de alerta (rojo si < mínimo)
- Registro de compras y ajustes con notas opcionales

#### Promociones (`/promotions`)
- Tipos: BUY_X_GET_Y, PERCENTAGE, COMBO
- Días de la semana, fechas de vigencia, asignación por sucursal
- Toggle activo/inactivo (usa PATCH parcial — no sobreescribe `branch_id` ni otros campos)

#### Reportes (`/reports`)
- **Tab General:** KPIs, gráfico diario, pie por categoría, tabla top productos, alertas stock
- **Tab Historial de ventas:** tabla paginada de órdenes, expandible para ver detalle de cada venta
- **Tab Por cajero:** resumen por cajero + detalle expandible de productos vendidos
- Filtros: sucursal, rango de fechas, presets (Hoy / Esta semana / Este mes)

#### Usuarios (`/users`)
- CRUD cajeros y cocineros: nombre, email, sucursal asignada
- Roles soportados: `admin`, `cajero`, `cocinero`
- Tag visual por rol (azul/verde/naranja)
- Roles manejados via Supabase Auth + tabla `profiles`

#### Sucursales (`/branches`)
- Toggle activo/inactivo con protección: no desactiva si hay cajeros asignados
- Modal de bloqueo muestra qué cajeros hay que reasignar primero

---

### POS (`/pos`)

- Login automático → detecta sucursal del cajero sin preguntar
- Catálogo de productos filtrable por categoría
- Carrito con control de cantidad
- Promociones del día cargadas automáticamente
  - Badge visual sobre productos con promo activa
  - Descuentos aplicados automáticamente al agregar al carrito
- Modal de confirmación con resumen de items y total
- Ticket post-venta con número de orden
- BroadcastChannel → actualiza display en tiempo real
- Panel **"Pedidos del día"** colapsable en header: lista todas las órdenes del día con estado de cocina
  - Badge de conteo de pedidos pendientes de cocina
  - Botón "Marcar listo" por pedido (actualiza `kitchen_status = 'ready'`)
  - Realtime: actualiza estado cuando la cocina marca como listo
- Logout seguro

---

### KDS — Pantalla de cocina (`/kitchen`)

- Pantalla dark theme optimizada para tablet/monitor en cocina
- Solo accesible para roles `cocinero` y `admin`
- Muestra órdenes con `kitchen_status = 'pending'` de la sucursal del usuario
- Cada tarjeta de orden muestra:
  - ID corto (`#XXXX`), hora de creación (timezone Bolivia), timer en minutos
  - Lista de productos con cantidad y descripción de ingredientes
  - Botón **"✓ Listo"** con actualización optimista
- Tarjetas con ≥10 minutos destacadas en rojo con badge "demorado"
- **Supabase Realtime:** INSERT en `orders` → re-fetch; UPDATE a `ready` → elimina tarjeta
- Reloj en header usando `formatTimeBolivia(new Date())`
- Filtrado por `branch_id` del perfil del cocinero

---

### Display cliente (`/display`)

- Modo **menú:** muestra todos los productos con imagen, descripción e ingredientes visibles
- Modo **pedido activo:** lista de items en tiempo real con precios y descuentos
- Modo **gracias:** pantalla de confirmación después de cobrar
- Comunicación via BroadcastChannel (misma PC, sin internet)

---

## Arquitectura técnica

### Autenticación y seguridad
- Supabase Auth con JWT
- Middleware Next.js redirige según rol: admin → `/`, cajero → `/pos`, cocinero → `/kitchen`
- Roles disponibles: `admin`, `cajero`, `cocinero`
- RLS en todas las tablas sensibles
- API routes con `Authorization: Bearer <token>` para verificar identidad
- Operaciones que requieren bypassar RLS (writes del cajero, reportes) usan **service role key** server-side

### Timezone
- Bolivia es UTC-4, sin horario de verano
- Centralizado en `src/lib/timezone.ts`
  - `todayInBolivia()` — fecha local correcta incluso después de las 20:00
  - `dateRangeFrom(date)` / `dateRangeTo(date)` — filtros Supabase con offset `-04:00`
  - `toBoliviaDate(utcDate)` — conversión para agrupación por día en reportes
  - `formatTimeBolivia(date)` — formatea hora HH:MM AM/PM en Bolivia; lee directo del ISO string del Date ajustado para evitar doble offset del browser
- El POS usa `todayInBolivia()` para cargar promociones del día
- KDS y POS usan `formatTimeBolivia()` para mostrar la hora del reloj y la hora de cada orden

### Promociones — lógica de stock
- `qty` en `order_items` = unidades cobradas al cliente
- `qty_physical` en `order_items` = unidades que salieron físicamente de la cocina
- Para BUY_X_GET_Y: `qty_physical = qty_pagadas + qty_gratis`
- `lib/recipes.ts` usa `qty_physical` para descontar stock → el inventario siempre refleja la realidad física

### Upload de imágenes
- Flujo: cliente → `/api/upload` (autentica usuario, sube con service role) → Supabase Storage
- Bucket: `product-images`
- Next.js `remotePatterns` configurado para el dominio de Supabase

### Soft delete
- Tablas con `is_active`: `branches`, `products`, `product_variants`, `ingredients`, `promotions`
- Los GETs filtran `is_active = true` por defecto (param `showInactive=true` para ver todos)
- Protecciones: no se desactiva un insumo con recetas activas, no se desactiva una sucursal con cajeros

---

## API Routes

### Productos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/products` | Lista productos (activos por default) |
| POST | `/api/products` | Crear producto con variantes, precios y receta |
| PUT | `/api/products/[id]` | Actualizar (upsert de variantes para no romper FK con order_items) |
| PATCH | `/api/products/[id]` | Toggle is_active |
| DELETE | `/api/products/[id]` | Soft delete |

### Stock
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/stock` | Stock actual por sucursal |
| POST | `/api/stock/purchase` | Registrar compra de insumo |
| POST | `/api/stock/adjust` | Ajuste manual de stock |
| GET | `/api/stock/alerts` | Insumos bajo mínimo |
| GET | `/api/stock/movements` | Historial de movimientos |

### Órdenes
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/orders` | Crear orden + items + descontar stock por receta |

### Reportes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/reports/sales` | KPIs: total, count, avg |
| GET | `/api/reports/daily` | Ventas agrupadas por día |
| GET | `/api/reports/top-products` | Productos más vendidos |
| GET | `/api/reports/orders` | Historial paginado de órdenes con detalle |
| GET | `/api/reports/cashiers` | Ventas agrupadas por cajero |

### Otros
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/promotions` | Listar / crear promociones |
| PUT/PATCH/DELETE | `/api/promotions/[id]` | Actualizar / toggle / soft delete |
| GET/POST | `/api/users` | Listar / crear cajeros (service role) |
| PUT/DELETE | `/api/users/[id]` | Actualizar / eliminar cajero |
| GET/POST | `/api/ingredients` | Listar / crear insumos |
| PATCH/DELETE | `/api/ingredients/[id]` | Toggle / soft delete insumo |
| POST | `/api/upload` | Subir imagen a Supabase Storage |

---

## Modelo de datos (resumen)

```
branches          — sucursales (id, name, address, is_active)
profiles          — usuarios extendidos (id, full_name, role, branch_id)

products          — productos (id, name, category, description, image_url, is_active)
product_variants  — variantes (id, product_id, name, base_price, is_active)
branch_prices     — precio por variante por sucursal (branch_id, variant_id, price)

ingredients       — insumos (id, name, unit, is_active)
branch_stock      — stock por sucursal (branch_id, ingredient_id, quantity, min_quantity)
recipes           — receta interna (variant_id, ingredient_id, quantity)
stock_movements   — historial (id, branch_id, ingredient_id, quantity, type, notes, created_by, created_at)

promotions        — promociones (id, name, type, days_of_week, start_date, end_date, branch_id, is_active)
promotion_rules   — reglas (promotion_id, variant_id, buy_qty, get_qty, discount_percent, combo_price)

orders            — ventas (id, branch_id, cashier_id, total, created_at, kitchen_status)
                    kitchen_status = 'pending' | 'ready'  (default: 'pending')
order_items       — detalle (order_id, variant_id, qty, qty_physical, unit_price, discount_applied)
```

---

## Tareas pendientes

### Pendientes de configurar en Supabase
- [ ] **Activar Realtime en tabla `orders`** (Supabase dashboard → Database → Replication → orders)
- [ ] **Política RLS para cocinero** (ejecutar en SQL editor):
  ```sql
  create policy "orders_kitchen_update" on orders
    for update
    using (get_user_role() = 'cocinero' and branch_id = get_user_branch_id())
    with check (get_user_role() = 'cocinero' and branch_id = get_user_branch_id());
  ```

### Mejoras planificadas
- [ ] **Reporte de promociones** (ver `docs/tasks/02-bugs-promocion-stock.md`): columnas unidades físicas / precio bruto / descuento / cobrado + resumen de promos aplicadas
- [ ] **PWA íconos:** generar PNGs reales (192×192 y 512×512) en `public/icons/` para instalación en iOS/Android

### Futuro (no planificado aún)
- Pedidos para llevar y delivery
- Gestión de mesas
- Integración con impresora de tickets
- Reportes exportables (PDF/Excel)

---

## Archivos clave

```
src/
├── lib/
│   ├── timezone.ts       ← Timezone Bolivia UTC-4 centralizado
│   ├── promotions.ts     ← Motor de promociones (getActivePromotions, applyPromotions)
│   ├── recipes.ts        ← Descuento de stock por receta al vender
│   ├── authProvider.ts   ← Refine AuthProvider
│   └── supabase.ts       ← Cliente Supabase (anon, client-side)
│
├── app/
│   ├── (admin)/          ← Panel admin (Refine + Ant Design)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── products/
│   │   │   └── [id]/     ← Detalle de producto
│   │   ├── ingredients/
│   │   ├── stock/
│   │   ├── promotions/
│   │   ├── reports/
│   │   ├── users/
│   │   └── branches/
│   │
│   ├── (pos)/
│   │   └── pos/          ← POS del cajero
│   │
│   ├── kitchen/          ← KDS pantalla de cocina (cocinero)
│   ├── display/          ← Pantalla secundaria del cliente
│   ├── login/
│   │
│   └── api/
│       ├── products/
│       ├── orders/       ← POST crea orden + items + deductStock
│       ├── stock/
│       ├── promotions/
│       ├── reports/
│       │   ├── sales/
│       │   ├── daily/
│       │   ├── top-products/
│       │   ├── orders/
│       │   └── cashiers/
│       ├── users/
│       ├── ingredients/
│       └── upload/       ← Subida de imágenes con service role
│
├── middleware.ts          ← Redirige según rol (admin/cajero/cocinero)
└── i18n/                 ← Traducciones ES/EN
```
