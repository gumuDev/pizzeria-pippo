# Plan de Desarrollo — Pizzería Pippo

## Fases

| # | Archivo | Descripción | Estado |
|---|---------|-------------|--------|
| 01 | [01-project-setup.md](./01-project-setup.md) | Setup inicial: Next.js, Refine, Supabase, Tailwind, i18n, PWA | ✅ |
| 02 | [02-database.md](./02-database.md) | Esquema de base de datos, migraciones, RLS | ✅ |
| 03 | [03-auth.md](./03-auth.md) | Autenticación con Supabase Auth, roles admin/cajero | ✅ |
| 04 | [04-ingredients.md](./04-ingredients.md) | Gestión de insumos (debe ir antes que productos) | ⬜ |
| 05 | [05-products.md](./05-products.md) | Catálogo de productos, variantes, precios, recetas | ⬜ |
| 06 | [06-inventory.md](./06-inventory.md) | Stock inicial, compras, ajustes, movimientos, alertas | ⬜ |
| 07 | [07-promotions.md](./07-promotions.md) | Motor de promociones: BUY_X_GET_Y, PERCENTAGE, COMBO | ⬜ |
| 08 | [08-pos.md](./08-pos.md) | Pantalla POS del cajero | ⬜ |
| 09 | [09-display.md](./09-display.md) | Pantalla secundaria del cliente (BroadcastChannel) | ⬜ |
| 10 | [10-reports.md](./10-reports.md) | Reportes por sucursal, productos, ingresos | ⬜ |
| 11 | [11-pwa.md](./11-pwa.md) | PWA para el administrador en celular | ⬜ |

## Orden de configuración inicial (dependencia estricta)

Al arrancar el sistema por primera vez, el admin debe seguir este orden:

```
1. Sucursales   ✅ registradas en seed data (fase 02)
2. Insumos      → registrar todos los insumos con su unidad de medida  (fase 04)
3. Productos    → descripción, imagen, variantes, precios y recetas    (fase 05)
                  (requiere insumos ya registrados)
4. Stock inicial → cuánto hay de cada insumo en cada sucursal          (fase 06)
5. Promociones  → reglas, días y vigencia                              (fase 07)
6. Cajeros      ✅ creados en Supabase Auth (fase 03)
```

> Los pasos 2 y 3 tienen dependencia estricta: las recetas no se pueden definir sin insumos previos.

## Convenciones
- Código en **inglés** (variables, funciones, componentes, comentarios)
- UI en **español** (default) — también soportar **inglés** vía i18n
- Librería i18n: `next-intl` (integración nativa con Next.js 14 App Router)
- Completar cada fase antes de avanzar a la siguiente
- Marcar tareas con: `[ ]` pendiente, `[x]` completado, `[~]` en progreso
