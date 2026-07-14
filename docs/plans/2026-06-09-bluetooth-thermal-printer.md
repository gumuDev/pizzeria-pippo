# Feature: Impresión de tickets con impresora térmica Bluetooth

**Fecha:** 2026-06-09
**Estado:** Implementado (Fases 1–4) — pendiente de validación manual con impresora física
**Rama:** `feature/bluetooth-thermal-printer`
**Módulos afectados:** `features/printing` (nuevo), `features/settings`, `features/pos`, `api/settings`

---

## 1. Objetivo

Permitir imprimir el ticket de venta del POS en una impresora térmica conectada por
Bluetooth, de forma **manual** (botón "Imprimir"), desde celular o PC, con el **ancho de
papel configurable (58mm / 80mm)** desde Configuraciones del panel admin.

---

## 2. Evaluación técnica

### Alternativas consideradas

| Opción | Cómo funciona | Pros | Contras |
|---|---|---|---|
| **Web Bluetooth + ESC/POS** ✅ | El navegador se conecta por BLE a la impresora y envía bytes ESC/POS directamente | Sin software extra, funciona en Chrome/Edge (Android y desktop), sin servidor intermedio, gratis | No funciona en iOS/Safari ni Firefox; hay que re-conectar al recargar la página |
| `window.print()` + CSS | Imprime el HTML del ticket por el diálogo del navegador | Simple, universal | Requiere que la impresora esté instalada como impresora del sistema (driver); en Android con impresoras BT genéricas casi nunca funciona; diálogo molesto en cada venta |
| QZ Tray / puente nativo | App instalada en la PC que recibe órdenes de impresión desde el navegador | Muy confiable, soporta USB/red | Solo PC, requiere instalar y mantener software extra, licencia para producción |
| App tipo RawBT (Android) | App intermediaria que recibe un intent/URL y la app imprime | Funciona en Android con cualquier impresora BT | Solo Android, depende de app de terceros, UX con saltos entre apps |

### Decisión

**Web Bluetooth + ESC/POS.** Es la única opción que funciona sin software adicional tanto
en celular Android como en PC, que son los dispositivos del POS. Limitación aceptada:
no funciona en iOS/Safari (se mostrará un aviso si el navegador no soporta Web Bluetooth).

### Notas técnicas clave

- **Protocolo:** ESC/POS (estándar de facto de las impresoras térmicas, incluidas las
  genéricas de 58mm y 80mm).
- **Conexión BLE:** `navigator.bluetooth.requestDevice()` → GATT → característica con
  permiso de escritura. Las impresoras genéricas suelen exponer los servicios
  `0x18F0` (char `0x2AF1`), `0xFFE0` (char `0xFFE1`) o `0xFF00`. La búsqueda se hará
  contra esta lista conocida, con fallback a `acceptAllDevices`.
- **Escritura en chunks:** BLE limita el tamaño de cada write (~20–512 bytes según MTU).
  Se envía el ticket en bloques de ~100 bytes con pequeña pausa entre writes.
- **Acentos/ñ:** las impresoras genéricas usan code pages (CP437/CP850), no UTF-8.
  Se mapearán los caracteres del español (á é í ó ú ñ ¿ ¡ °) a CP437; lo no mapeable se
  translitera (á→a).
- **Ancho de papel:** 58mm = 32 caracteres por línea, 80mm = 48 caracteres por línea.
  Es solo un parámetro del formateador — cambiar de impresora es cambiar el ajuste.
- **Re-conexión:** el pairing de Web Bluetooth no persiste entre recargas de página de
  forma estándar. El cajero conecta la impresora una vez por sesión desde el POS
  (botón de estado en el header). El ticket se puede imprimir mientras la conexión siga viva.

---

## 3. Alcance

### Incluye

- Servicio ESC/POS: convierte `TicketData` + ancho de papel en bytes listos para enviar.
- Servicio Bluetooth: conectar, desconectar, enviar bytes en chunks, estado de conexión.
- Hook `usePrinter`: expone `connect / disconnect / print / status` al POS.
- Botón **"Imprimir"** en `TicketModal` (impresión manual tras confirmar la venta).
- Indicador/botón de conexión de impresora en el header del POS.
- Configuración en panel admin → Configuraciones: sección **Impresora** con
  `printer_paper_width` (58 / 80).
- Aviso claro cuando el navegador no soporta Web Bluetooth (iOS/Firefox).

### No incluye (futuro)

- Impresión automática al confirmar venta (se pidió manual por ahora).
- Reimpresión desde el panel de órdenes del día.
- Ticket de cocina / comanda separada.
- Logo gráfico en el ticket (solo texto en esta fase).

---

## 4. Arquitectura

Nuevo feature siguiendo la estructura estándar:

```
src/features/printing/
├── components/
│   └── PrinterStatusButton.tsx     ← botón conectar/desconectar + estado (header POS)
├── hooks/
│   └── usePrinter.ts               ← estado de conexión, print(ticket), maneja errores
├── services/
│   ├── escpos.service.ts           ← TicketData + config → Uint8Array (puro, testeable)
│   └── bluetooth-printer.service.ts ← Web Bluetooth: connect, write chunked, disconnect
├── types/
│   └── printing.types.ts           ← PrinterConfig, PrinterStatus, PaperWidth
└── constants/
    └── printing.constants.ts       ← UUIDs BLE conocidos, chars por línea, chunk size
```

**Reglas respetadas:** los hooks no tocan Web Bluetooth directamente (pasa por el
service), componentes sin lógica, archivos bajo los límites de líneas.

### Cambios en módulos existentes

| Archivo | Cambio |
|---|---|
| `features/settings/types/index.ts` | + `printer_paper_width: number` en `AppSettings` |
| `features/settings/components/PrinterSettingsForm.tsx` | Nueva sección con select 58/80 |
| `app/(admin)/settings/page.tsx` | Renderiza la nueva sección |
| `app/api/settings/route.ts` | GET/PUT incluyen la key `printer_paper_width` |
| `features/pos/components/TicketModal.tsx` | + botón "Imprimir" (recibe callback por props) |
| `features/pos` header / `app/(pos)/pos/page.tsx` | Monta `PrinterStatusButton` y `usePrinter` (cambio mínimo, la página ya excede el límite y está en plan de refactor) |

### Base de datos

**Sin migración.** `app_settings` es key-value; `printer_paper_width` se crea con el
`upsert` existente del PUT. Default en código: `58`.

El POS (cajero) necesita **leer** el ancho de papel: el GET de `/api/settings` es solo
admin, así que el ancho se leerá vía una key pública mínima (endpoint o query liviana
desde el service de printing usando la sesión del cajero — se define en la Fase 3 según
las políticas RLS existentes de `app_settings`).

---

## 5. Plan de implementación (un módulo a la vez, `tsc --noEmit` tras cada fase)

1. **Fase 1 — Núcleo ESC/POS:** `types`, `constants`, `escpos.service.ts`.
   Formato del ticket: encabezado (Pizzería Pippo + sucursal + fecha), número diario
   grande, items con cantidad/variante/mitades/promo, total, método de pago, corte.
2. **Fase 2 — Bluetooth:** `bluetooth-printer.service.ts` + `usePrinter.ts`.
3. **Fase 3 — Configuración:** types + API + `PrinterSettingsForm` en admin.
4. **Fase 4 — Integración POS:** botón en `TicketModal`, `PrinterStatusButton` en header.
5. **Fase 5 — Validación manual y documentación final** (`docs/` + actualizar este plan a "Implementado").

Cada fase termina con validación del usuario antes de continuar.

---

## 6. Validación manual

1. En admin → Configuraciones, elegir ancho 58mm y guardar.
2. En el POS (Chrome Android o desktop), tocar el botón de impresora → seleccionar la
   impresora en el diálogo Bluetooth → estado "conectada".
3. Confirmar una venta → en el ticket en pantalla, tocar **Imprimir** → sale el ticket
   físico con acentos correctos y ancho correcto.
4. Cambiar la config a 80mm → reimprimir → el layout usa 48 columnas.
5. Abrir el POS en un navegador sin soporte (iPhone/Safari) → se muestra aviso y el
   botón de imprimir queda deshabilitado, sin romper el flujo de venta.

## 7. Riesgos

- **Impresora con UUIDs no estándar:** mitigado con fallback `acceptAllDevices` y
  detección de la característica escribible.
- **Cortes de conexión BLE:** el hook detecta desconexión y muestra estado; reimprimir
  requiere reconectar (1 toque).
- **iOS:** sin soporte — documentado y comunicado en UI.
