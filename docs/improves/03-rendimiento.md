# Mejoras a Considerar – Optimización de Build en Next.js

## 1. Reducir el tamaño de páginas pesadas
Actualmente algunas páginas tienen un **First Load JS mayor a 400 kB**, lo cual puede afectar el tiempo de carga inicial.

Páginas a priorizar:

- `/dashboard`
- `/products`
- `/reports`
- `/stock`
- `/warehouse`

Objetivo recomendado:

- Ideal: **150 kB – 250 kB**
- Aceptable: **250 kB – 300 kB**
- A optimizar: **> 400 kB**

Acciones sugeridas:

- Reducir dependencias del lado cliente.
- Evitar cargar librerías pesadas en la carga inicial.
- Dividir funcionalidades grandes en módulos independientes.

---

## 2. Separar funcionalidades grandes en cargas diferidas
Algunas páginas concentran múltiples funcionalidades en una sola carga inicial.

Mejora recomendada:

- Cargar módulos pesados **solo cuando el usuario los necesite**.
- Aplicar **lazy loading** en secciones como:
  - reportes
  - gráficos
  - tablas complejas
  - paneles analíticos

Beneficios:

- Reduce el **First Load JS**.
- Mejora el **Time To Interactive**.
- Reduce el consumo de memoria del navegador.

---

## 3. Minimizar componentes que se ejecutan en el cliente
El uso excesivo de componentes que se ejecutan en el navegador incrementa el tamaño del bundle.

Buenas prácticas:

- Mantener lógica en el servidor cuando sea posible.
- Evitar marcar páginas completas como componentes de cliente.
- Limitar el uso de estado y efectos solo a componentes que realmente lo necesiten.

Beneficios:

- Menor tamaño de JavaScript enviado al navegador.
- Mejor rendimiento inicial.

---

## 4. Revisar dependencias pesadas
Algunas librerías pueden aumentar significativamente el tamaño del bundle.

Áreas donde suele ocurrir:

- librerías de gráficos
- componentes de tablas avanzadas
- selectores de fecha
- utilidades grandes que se importan completas

Acciones recomendadas:

- Verificar si existen alternativas más ligeras.
- Importar solo las funcionalidades necesarias.

---

## 5. Optimizar páginas de reportes
Los reportes suelen incluir múltiples componentes pesados:

- gráficos
- cálculos
- filtros
- exportaciones

Mejoras recomendadas:

- Dividir reportes en módulos independientes.
- Cargar cada tipo de reporte únicamente cuando el usuario lo seleccione.
- Evitar cargar todos los reportes al entrar a la página.

---

## 6. Mantener control sobre el bundle compartido
El bundle compartido actual es estable, pero es importante mantenerlo bajo control para evitar que crezca con el tiempo.

Buenas prácticas:

- Evitar agregar dependencias globales innecesarias.
- Mantener librerías compartidas lo más ligeras posible.
- Revisar periódicamente el tamaño del bundle después de agregar nuevas funcionalidades.

---

## 7. Monitorear métricas de build continuamente
Las métricas del build deben revisarse regularmente para evitar regresiones de rendimiento.

Indicadores clave a monitorear:

- **First Load JS por página**
- **Tamaño de bundles compartidos**
- **Páginas con crecimiento inesperado**

Esto permite detectar rápidamente cuándo una nueva funcionalidad aumenta el peso de la aplicación.

---

## Objetivo final

Mantener una aplicación que:

- cargue rápido
- envíe la menor cantidad de JavaScript posible
- escale sin aumentar excesivamente el tamaño del bundle
- mantenga una buena experiencia de usuario incluso en conexiones lentas

---

## Métricas de build — Historial

### Sprint de optimización — 2026-03-17

**Acciones aplicadas:**
- `/login`: eliminado Ant Design completo → HTML + Tailwind puro
- `/dashboard`: eliminados todos los iconos de `@ant-design/icons` → SVG inline
- `/stock`: eliminados 5 iconos de `@ant-design/icons` → SVG inline; lazy-load en 3 tabs (purchase, adjust, historial)
- `/promotions`: lazy-load de `PromotionModal` con `dynamic()`
- `/reports` (OrdersTable): extraídos `OrdersSummary` y `OrdersMobileList`; eliminado `FileExcelOutlined`
- `/warehouse`: refactor completo de 469 líneas → feature-based (`useWarehouse`, `WarehouseTable`, `WarehouseModals`, `warehouse-stock.service`); 7 iconos → SVG inline

**Resultado del build (2026-03-17):**

| Página | First Load JS | Estado |
|--------|--------------|--------|
| `/login` | 141 kB | ✅ Excelente (antes: 292 kB) |
| `/dashboard` | 509 kB | 🔴 Pesado (ver nota) |
| `/display` | 147 kB | ✅ Excelente |
| `/kitchen` | 147 kB | ✅ Excelente |
| `/pos` | 347 kB | ✅ Aceptable |
| `/products` | 466 kB | 🔴 A optimizar |
| `/promotions` | 396 kB | ⚠️ Aceptable (modal lazy) |
| `/reports` | 440 kB | 🔴 A optimizar |
| `/stock` | 424 kB | 🔴 A optimizar (tabs lazy) |
| `/users` | 410 kB | 🔴 A optimizar |
| `/warehouse` | 419 kB | 🔴 A optimizar |
| `/warehouse/purchase` | 307 kB | ✅ Aceptable |
| `/warehouse/transfer` | 306 kB | ✅ Aceptable |
| Shared bundle | 88 kB | ✅ Estable |

**Nota sobre `/dashboard` (509 kB):** El peso alto se debe al bundle compartido de Refine + Ant Design (~400 kB base) que se carga en todas las páginas admin. No es reducible sin cambiar el framework.

**Ganancia principal:**
- `/login`: **-151 kB** (de 292 kB a 141 kB) — mayor impacto visible

**Páginas pendientes de optimización futura:**
- `/products` (466 kB) — `useProductForm` (169 líneas) y `ProductsTable` (205 líneas) candidatos a refactor
- `/reports` (440 kB) — `recharts` ya lazy-loaded; evaluar lazy-load de `ReportFilters` (DatePicker)
- `/stock` (424 kB) — tabs lazy aplicados; el base es el shared bundle de Refine
- `/users` (410 kB) — revisar imports de Ant Design en componentes