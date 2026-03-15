# CLAUDE.md — Sistema de Gestión para Restaurante de Pizza

## Descripción del Proyecto

Sistema full-stack de gestión para restaurante de pizza con múltiples sucursales. Incluye punto de venta (POS) para cajeros, administración de inventario por recetas, motor de promociones flexible, reportes por sucursal y soporte PWA para el administrador. Cuenta con pantalla secundaria para mostrar el menú o el pedido al cliente en tiempo real.

---

## Stack Tecnológico

### Frontend + Backend (Full-Stack)
- **Next.js 14** (App Router) — framework principal, maneja frontend y backend en un solo proyecto
- **Refine** — framework para el panel admin (CRUD, tablas, formularios, filtros automáticos)
- **Ant Design** — componentes de UI (usado con Refine, basado en finefoods-antd)
- **Tailwind CSS** — estilos utilitarios para pantallas custom (POS, display cliente)
- **next-pwa** — convierte la app en PWA instalable para el administrador en celular

### Base de Datos y Backend como Servicio
- **Supabase** — PostgreSQL gestionado, auth y storage de imágenes
- **Supabase Storage** — almacenamiento de imágenes del menú
- **Supabase Auth** — JWT con roles: `admin`, `cajero`
- **Row Level Security (RLS)** — seguridad a nivel de fila para aislar datos por sucursal
- **BroadcastChannel API** — comunicación entre POS y display cliente en la misma PC, sin internet ni Realtime

---

## Características del Sistema

### 1. Multi-Sucursal
- Dos sucursales (A y B) con datos aislados por RLS
- Precios de productos pueden variar entre sucursales
- Stock de insumos independiente por sucursal
- Reportes por sucursal individual o consolidado

### 2. Catálogo de Productos
- Productos con variantes de tamaño: personal, mediana, familiar
- Categorías: pizza, bebida, otro
- Cada producto tiene **dos capas de información separadas**:
  - **Descripción para el cliente** — texto libre con los ingredientes visibles (ej: "Pepperoni, mozzarella, salsa de tomate"), mostrada en el display y menú público
  - **Receta interna** — cantidad en gramos/ml de cada insumo por variante, usada solo para descontar el stock automáticamente al vender. El cliente nunca ve esto.
- Imagen del producto subida desde el admin y servida desde Supabase Storage
- Precios configurables por variante y por sucursal

### 3. Registro de Productos (Flujo del Admin)
Al registrar un nuevo producto el admin completa tres pasos:

**Paso 1 — Datos generales:**
- Nombre del producto (ej: "Pizza Pepperoni")
- Categoría (pizza / bebida / otro)
- Descripción para el cliente (ej: "Pepperoni, mozzarella, salsa de tomate")
- Imagen del producto

**Paso 2 — Variantes y precios:**
- Agrega cada tamaño disponible: Personal, Mediana, Familiar
- Define el precio base por variante
- Si Sucursal B tiene precio distinto, configura el precio por sucursal

**Paso 3 — Receta por variante (para el inventario):**
- Para cada variante define qué insumos usa y en qué cantidad
- Ejemplo para "Pizza Mediana": harina 250g, tomate 150g, queso 180g, pepperoni 100g
- Ejemplo para "Pizza Personal": harina 150g, tomate 80g, queso 100g, pepperoni 60g
- Cada variante tiene su propia receta porque usa cantidades distintas

### 4. Control de Inventario por Recetas
- Insumos registrados con unidad de medida: gramos, kilos, mililitros, litros, unidades
- Cada variante de producto tiene una receta interna con la cantidad exacta de cada insumo
- Al registrar una venta, el sistema descuenta automáticamente los insumos según la receta
- Registro de compras de insumos (entrada de stock)
- Ajuste manual de stock para correcciones físicas (conteo físico vs sistema)
- Alertas de stock bajo configurables por insumo y sucursal
- Todos los movimientos quedan registrados en `stock_movements` (compra, venta, ajuste)

### 5. Motor de Promociones
Sistema flexible basado en reglas `condición → beneficio` que soporta:
- **BUY_X_GET_Y** — compra X llévate Y gratis (ej: 2x1, compra 4 llévate 5)
- **PERCENTAGE** — descuento porcentual en productos o categorías
- **COMBO** — precio especial por combinación de productos

Cada promoción tiene:
- Días de la semana en que aplica (ej: domingo, miércoles)
- Fecha de inicio y fin de vigencia
- Productos o variantes a los que aplica
- Asignación por sucursal (cada sucursal puede tener sus propias promos)

El cajero no necesita hacer nada manual: al abrir el POS el sistema detecta las promos vigentes del día y las muestra visualmente sobre los productos.

### 6. Punto de Venta (POS)
- Aplicación web optimizada para **PC de escritorio**
- Al iniciar sesión, el cajero ya tiene su sucursal asignada — el sistema la detecta automáticamente por debajo, nunca se le pregunta
- Al abrir el POS, el sistema carga las promociones vigentes del día y la sucursal
- Los productos con promo activa aparecen destacados visualmente (badge, etiqueta "2x1", "4+1", etc.)
- El cajero selecciona productos y los descuentos se aplican automáticamente
- Al confirmar la venta el sistema descuenta el stock por receta automáticamente
- Cierre de venta y generación de ticket

### 7. Pantalla Secundaria para el Cliente (Display)
- Ruta `/display` que se abre en una segunda ventana del mismo navegador y se arrastra al monitor secundario
- Comunicación mediante **BroadcastChannel API** — sin internet, sin Realtime, instantáneo porque todo está en la misma PC
- Mientras el cajero arma el pedido, el display muestra en tiempo real los productos agregados y el total
- Cuando no hay pedido activo muestra el menú con fotos, descripción e ingredientes visibles
- El cliente nunca ve gramos ni información interna de recetas

### 8. Reportes
- Ventas del día / semana / mes por sucursal o consolidado
- Productos más vendidos
- Ingresos totales y por categoría
- Alertas de stock bajo por insumo y sucursal

### 9. PWA (Progressive Web App)
- Orientada principalmente al **administrador** para revisar reportes desde su celular
- El POS es una app web desktop, no requiere PWA
- Instalable en Android e iOS desde el navegador sin pasar por tienda de apps

---

## Estructura del Proyecto

```
/
├── app/
│   ├── api/                        # Backend (equivalente a controllers)
│   │   ├── products/route.ts
│   │   ├── orders/route.ts
│   │   ├── promotions/route.ts
│   │   ├── stock/route.ts
│   │   └── reports/route.ts
│   │
│   ├── (admin)/                    # Panel administrador (Refine)
│   │   ├── dashboard/page.tsx
│   │   ├── products/page.tsx       # Registro de productos + variantes + recetas
│   │   ├── ingredients/page.tsx    # Gestión de insumos
│   │   ├── stock/page.tsx          # Compras, ajustes y movimientos de stock
│   │   ├── promotions/page.tsx
│   │   └── reports/page.tsx
│   │
│   ├── (pos)/                      # Pantalla del cajero
│   │   └── pos/page.tsx
│   │
│   └── display/                    # Pantalla secundaria del cliente
│       └── page.tsx
│
├── components/                     # Componentes reutilizables
├── lib/
│   ├── supabase.ts                 # Cliente Supabase
│   ├── promotions.ts               # Motor de promociones
│   └── recipes.ts                  # Lógica de descuento por receta al vender
│
└── public/
    ├── manifest.json               # PWA manifest
    └── sw.js                       # Service Worker (next-pwa)
```

---

## Modelo de Base de Datos (Resumen)

```
branches              — sucursales (id, name, address)

products              — productos (id, name, category, description, image_url)
                        description = ingredientes visibles para el cliente
                        image_url   = foto del producto en Supabase Storage

product_variants      — variantes (id, product_id, name, base_price)
                        name = "Personal" | "Mediana" | "Familiar"

branch_prices         — precio por variante por sucursal (branch_id, variant_id, price)

ingredients           — insumos (id, name, unit)
                        unit = "g" | "ml" | "unidad"

branch_stock          — stock por sucursal (branch_id, ingredient_id, quantity, min_quantity)
                        min_quantity = umbral para alertas de stock bajo

recipes               — receta interna por variante (variant_id, ingredient_id, quantity)
                        cantidad en gramos/ml que se descuenta al vender esa variante

stock_movements       — movimientos de stock (id, branch_id, ingredient_id, quantity, type, created_at)
                        type = "compra" | "venta" | "ajuste"

promotions            — promociones (id, name, type, days_of_week, start_date, end_date, branch_id)
                        type = "BUY_X_GET_Y" | "PERCENTAGE" | "COMBO"
                        days_of_week = [0,3] → domingo y miércoles

promotion_rules       — reglas de la promo (promotion_id, variant_id, buy_qty, get_qty, discount_percent)

orders                — ventas (id, branch_id, cashier_id, total, created_at)

order_items           — detalle de venta (order_id, variant_id, qty, unit_price, discount_applied)
```

---

## Roles y Acceso

| Rol | Acceso | Dispositivo |
|-----|--------|-------------|
| `admin` | Todo el sistema, ambas sucursales | PC o celular |
| `cajero` | Solo pantalla POS de su sucursal asignada (automática) | PC de escritorio |

**Usuarios en Supabase Auth:** solo cajeros y admins (3-4 usuarios máximo). Los clientes del restaurante NO tienen cuenta en el sistema — el plan free de Supabase (50,000 MAU) es más que suficiente.

## Dispositivos por Pantalla

| Pantalla | Dispositivo | Comunicación |
|----------|-------------|--------------|
| POS (cajero) | PC de escritorio | — |
| Display cliente | Monitor secundario, misma PC | BroadcastChannel API |
| Admin / Reportes | PC o celular del dueño | PWA |

---

## Funcionalidades Futuras (Planificadas)

- Pedidos para llevar y delivery
- Gestión de mesas
- Integración con impresora de tickets
- App móvil nativa (si se requiere más adelante)

---

## Referencias

- Ejemplo base: [finefoods-antd](https://github.com/refinedev/refine/tree/master/examples/finefoods-antd)
- Demo admin: https://example.admin.refine.dev/
- Documentación Refine + Supabase: https://refine.dev/docs/data/packages/supabase/
- Documentación next-pwa: https://github.com/shadowwalker/next-pwa

---

## Orden de Configuración Inicial

Al instalar el sistema por primera vez, el admin debe configurar en este orden estricto:

```
1. Sucursales        — registrar Sucursal A y Sucursal B
2. Insumos           — registrar todos los insumos con su unidad de medida
                       (tomate/g, harina/g, queso/g, pepperoni/g, etc.)
3. Productos         — registrar cada pizza/bebida con:
                         - descripción para el cliente
                         - imagen
                         - variantes y precios
                         - receta interna por variante (requiere insumos ya registrados)
4. Stock inicial     — registrar cuánto hay de cada insumo en cada sucursal al arrancar
5. Promociones       — configurar las promos con sus reglas, días y vigencia
6. Usuarios cajeros  — crear las cuentas de los cajeros y asignarles su sucursal
```

> **Importante:** Los pasos 2 y 3 tienen dependencia estricta. No se puede definir la receta de un producto si los insumos no existen previamente en el sistema.

---

## Código del Proyecto

- El código estará escrito en **inglés** (variables, funciones, componentes, comentarios)
- La interfaz de usuario se mostrará en **español**
- Implementar **internacionalización (i18n)** desde el inicio para soportar múltiples idiomas
- Por el momento los idiomas soportados son: **español** (default) e **inglés**
- Librería recomendada: `next-intl` — integración nativa con Next.js 14 App Router

## Base de Datos — Estructura y Migraciones

Los archivos de la base de datos viven en `docs/database/`:

```
docs/database/
├── schema-base.sql      ← Schema real actual (exportado de Supabase, solo referencia)
├── README.md            ← Convenciones y reglas
└── migrations/          ← Un archivo por cada cambio aplicado después del schema inicial
    ├── 002_*.sql
    ├── 003_*.sql
    └── ...
```

### Reglas obligatorias para cambios en la BD

1. **Antes de aplicar cualquier cambio en Supabase**, crear el archivo de migración en `docs/database/migrations/` con el nombre `NNN_descripcion.sql` (número secuencial de 3 dígitos).
2. **Después de aplicar el cambio**, actualizar `docs/database/schema-base.sql` para reflejar el estado real.
3. **Nunca modificar** `supabase/001_schema.sql` — ese archivo es el estado inicial del proyecto.
4. Si un cambio ya fue aplicado en Supabase pero no estaba documentado, crear igual el archivo con una nota `-- Ya aplicado en Supabase el YYYY-MM-DD`.
5. Los archivos de migración son documentación/referencia — se aplican **manualmente** en el SQL Editor de Supabase, no se ejecutan automáticamente.

---

## Arquitectura de Código — Feature-Based

Todo nuevo feature debe seguir esta estructura. **Nunca agregar lógica directamente en `page.tsx`.**

```
src/features/<nombre>/
├── components/   ← UI pura, sin queries ni lógica de negocio
├── hooks/        ← estado, lógica, llamadas a services
├── services/     ← API calls y queries a Supabase
├── types/        ← interfaces TypeScript
└── constants/    ← config estática (opciones de select, colores, etc.)
```

### Reglas de tamaño obligatorias

| Archivo | Máximo |
|---|---|
| `page.tsx` | 100 líneas |
| `components/` | 200 líneas |
| `hooks/` | 200 líneas |
| `services/` | 150 líneas |

> Si un archivo supera **300 líneas**, debe dividirse antes de continuar.

### Responsabilidades

- **`page.tsx`** — solo layout: importa componentes y hooks, sin lógica ni queries
- **`hooks/`** — estado y lógica de negocio, llama a services
- **`services/`** — comunicación con backend y Supabase, sin estado
- **`components/`** — UI, recibe props, sin queries directas a Supabase

### Ejemplo de estructura para una feature

Usar `branches` como referencia al implementar cualquier feature nuevo:

```
src/features/branches/
├── components/
│   ├── BranchesTable.tsx         ← tabla con columnas y acciones
│   ├── BranchModal.tsx           ← modal crear/editar
│   └── BranchBlockedModal.tsx    ← modal de bloqueo con cajeros asignados
│
├── hooks/
│   └── useBranches.ts            ← fetch, crear, editar, toggle activo
│
├── services/
│   └── branches.service.ts       ← getBranches(), createBranch(), updateBranch()
│
└── types/
    └── branch.types.ts           ← Branch, Cashier
```

`page.tsx` resultado esperado (~25 líneas):
```tsx
"use client";
import { BranchesTable } from "@/features/branches/components/BranchesTable";
import { BranchModal } from "@/features/branches/components/BranchModal";
import { useBranches } from "@/features/branches/hooks/useBranches";

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

### Plan de refactor del código existente

Los módulos actuales aún no siguen esta arquitectura. El plan de refactor está documentado en:
`docs/improves/refactor-architecture/` — un archivo por módulo, en orden de prioridad.

---

## Reglas de Trabajo

- El usuario ejecuta manualmente `npm run dev` y `npm run build` — Claude nunca ejecuta estos dos comandos
- Claude **puede ejecutar** cualquier otro comando: `npm install`, `mkdir`, mover archivos, etc.

## Development Approach
- NEVER rush ahead with multiple features at once. Implement ONE feature at a time.
- After implementing a feature, ask the user to validate before proceeding.
- When building UI components, show the user what you plan to build BEFORE writing code.

## Debugging Rules
- Identify the ACTUAL root cause before attempting fixes.
- Limit yourself to 3 attempts on a single bug before asking for more context.
- If first fix doesn't work, step back and re-read error/logs before trying another.

## Code Changes
- After refactors touching multiple files, run `tsc --noEmit` BEFORE presenting work as complete.
- Do not add columns, fields, or summary stats that weren't explicitly requested.