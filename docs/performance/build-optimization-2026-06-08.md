# Build Optimization — Plan de trabajo
**Fecha:** 2026-06-08
**Base:** análisis de `npm run analyze` + output del build

---

## Métricas actuales (baseline)

| Ruta | First Load JS | Propio de la ruta |
|------|--------------|-------------------|
| `/dashboard` | **512 kB** | 107 kB |
| `/products/[id]` | **479 kB** | 4.17 kB |
| `/reports` | **470 kB** | 98.8 kB |
| `/products` | 464 kB | 5.44 kB |
| `/settings` | 450 kB | 9.88 kB |
| `/pos` | 365 kB | 22.4 kB |
| `/display` | 147 kB | 3.22 kB ✅ |
| `/kitchen` | 147 kB | 3.16 kB ✅ |
| `/login` | 141 kB | 2 kB ✅ |
| Shared por todas | 88 kB | — |

**Meta:** bajar `/dashboard` y `/reports` por debajo de 400 kB First Load.

---

## Tasks

### TASK-01 — `themeColor` en viewport export
**Tipo:** Warning / compatibilidad  
**Impacto:** Elimina 20+ warnings del build, compatibilidad con Next.js 15  
**Archivos:** layout raíz y layouts de cada sección con `export const metadata`  
**Esfuerzo:** Muy bajo — cambio mecánico

**Qué hacer:**
Mover `themeColor` de `metadata` a `viewport` export en todos los layouts afectados:
```ts
// ❌ Antes
export const metadata = {
  themeColor: "#...",
  ...
}

// ✅ Después
export const viewport = {
  themeColor: "#...",
}
export const metadata = { ... }
```

**Páginas afectadas según build:**
`/`, `/branches`, `/dashboard`, `/display`, `/ingredients`, `/kitchen`, `/login`,
`/pos`, `/products`, `/promotions`, `/reports`, `/settings`, `/stock`,
`/users`, `/variant-types`, `/warehouse`, `/warehouse/movements`,
`/warehouse/purchase`, `/warehouse/transfer`

**Validación:**
- [ ] `npm run build` sin ningún warning de `themeColor`

---

### TASK-02 — Dynamic import de `recharts` en `/dashboard`
**Tipo:** Performance  
**Impacto estimado:** −80 a −120 kB en First Load de `/dashboard`  
**Archivos:** componentes de gráficos en `/dashboard`  
**Esfuerzo:** Bajo

**Qué hacer:**
Los gráficos de `recharts` (LineChart, PieChart, etc.) se cargan síncronamente con la página.
Hay que convertirlos a dynamic imports con `ssr: false` para que se carguen solo cuando el browser los necesita:

```ts
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then(m => ({ default: m.LineChart })), { ssr: false });
```

O mejor: envolver el componente de gráfico completo en un dynamic import.

**Validación:**
- [ ] Build muestra `/dashboard` con First Load < 420 kB
- [ ] Los gráficos siguen funcionando en browser
- [ ] No hay flash / layout shift visible al cargar la página

---

### TASK-03 — Dynamic import de `recharts` en `/reports`
**Tipo:** Performance  
**Impacto estimado:** −80 a −120 kB en First Load de `/reports`  
**Archivos:** componentes de gráficos en `/reports`  
**Esfuerzo:** Bajo  
**Depende de:** TASK-02 (mismo patrón, aplicarlo después para reutilizar lo aprendido)

**Validación:**
- [ ] Build muestra `/reports` con First Load < 380 kB
- [ ] Los gráficos de reportes siguen funcionando
- [ ] La exportación a Excel no se ve afectada

---

### TASK-04 — Dynamic import de `xlsx` en `/reports`
**Tipo:** Performance  
**Impacto estimado:** −40 a −60 kB en First Load de `/reports`  
**Archivos:** función de exportación en reports  
**Esfuerzo:** Bajo  
**Depende de:** TASK-03

**Qué hacer:**
`xlsx` solo se usa cuando el usuario hace click en "Exportar". No tiene sentido cargarlo al abrir la página.

```ts
// En el handler del botón exportar:
const handleExport = async () => {
  const XLSX = await import("xlsx");
  // usar XLSX normalmente...
};
```

**Validación:**
- [ ] Build muestra `/reports` con First Load < 340 kB
- [ ] Exportar a Excel sigue funcionando después del click
- [ ] El click de exportar no demora más de 1 segundo la primera vez

---

## Estado

| Task | Estado | First Load antes | First Load después |
|------|--------|-----------------|-------------------|
| TASK-01 themeColor warnings | ✅ Completo | — | 0 warnings |
| TASK-02 recharts /dashboard | ✅ Completo | 512 kB | **299 kB** |
| TASK-03 recharts /reports | ✅ Ya estaba hecho | 470 kB | — |
| TASK-04 xlsx /reports | ✅ Completo | 470 kB | **379 kB** |

---

## Cómo medir después de cada task

```bash
npm run build 2>&1 | grep -E "dashboard|reports|products|pos"
```

Esto muestra solo las rutas relevantes del output del build sin tener que leer todo.
