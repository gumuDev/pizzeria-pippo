# Plan de Refactor — Feature-Based Architecture

## Objetivo

Migrar el código actual de archivos gigantes en `page.tsx` a una arquitectura
feature-based con separación clara de responsabilidades.

**Regla principal:** ningún `page.tsx` debe superar 100 líneas.
**Regla de archivos:** si un archivo supera 300 líneas, debe dividirse.

---

## Estado actual

| Archivo | Líneas | Prioridad |
|---|---|---|
| `(pos)/pos/page.tsx` | 866 | 🔴 Alta |
| `(admin)/reports/page.tsx` | 738 | 🔴 Alta |
| `(admin)/products/page.tsx` | 599 | 🔴 Alta |
| `(admin)/promotions/page.tsx` | 490 | 🟡 Media |
| `(admin)/stock/page.tsx` | 381 | 🟡 Media |
| `(admin)/users/page.tsx` | 346 | 🟡 Media |
| `(admin)/dashboard/page.tsx` | 351 | 🟡 Media |
| `(admin)/branches/page.tsx` | 236 | 🟢 Baja |
| `(admin)/ingredients/page.tsx` | 198 | 🟢 Baja |
| `display/page.tsx` | 270 | 🟢 Baja |

---

## Tasks (en orden de prioridad)

| # | Task | Archivo | Estado |
|---|---|---|---|
| 01 | Refactor POS | `01-refactor-pos.md` | ✅ Completo |
| 02 | Refactor Reports | `02-refactor-reports.md` | ✅ Completo |
| 03 | Refactor Products | `03-refactor-products.md` | ✅ Completo |
| 04 | Refactor Promotions | `04-refactor-promotions.md` | ✅ Completo |
| 05 | Refactor Stock | `05-refactor-stock.md` | ✅ Completo |
| 06 | Refactor Users | `06-refactor-users.md` | ✅ Completo |
| 07 | Refactor Dashboard | `07-refactor-dashboard.md` | ✅ Completo |
| 08 | Refactor Branches | `08-refactor-branches.md` | ✅ Completo |
| 09 | Refactor Ingredients | `09-refactor-ingredients.md` | ✅ Completo |
| 10 | Refactor Display | `10-refactor-display.md` | ✅ Completo |

---

## Reglas del refactor

1. **NO cambiar lógica existente** — solo reorganizar código
2. **NO modificar base de datos**
3. **NO cambiar APIs**
4. Cada task se ejecuta de forma independiente — no hay dependencias entre módulos
5. Al terminar cada task, actualizar el estado en este archivo

---

## Estructura destino

```
src/
├── features/
│   ├── pos/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── products/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── constants/
│   ├── promotions/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── stock/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── reports/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── branches/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── ingredients/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── display/
│       ├── components/
│       ├── hooks/
│       └── types/
│
└── shared/
    ├── components/
    ├── hooks/
    ├── utils/
    └── types/
```
