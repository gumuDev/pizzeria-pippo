# 11 — PWA (Progressive Web App)

## Objetivo
Hacer la app instalable en Android e iOS para que el admin pueda revisar reportes desde su celular sin pasar por la tienda de apps.

## Archivos creados/modificados
- `next.config.mjs` — configuración de `next-pwa`
- `public/manifest.json` — Web App Manifest
- `src/app/layout.tsx` — meta tags PWA en `<head>`
- `public/icons/icon-192x192.png` — ícono 192x192 (pendiente)
- `public/icons/icon-512x512.png` — ícono 512x512 (pendiente)

## Tareas

### Configuración next-pwa
- [x] Instalar y configurar `next-pwa` en `next.config.mjs`
- [x] Habilitar PWA solo en producción (`disable: process.env.NODE_ENV === 'development'`)
- [x] `register: true`, `skipWaiting: true`

### Web App Manifest (`public/manifest.json`)
- [x] `name`: "Pizzería Pippo Admin"
- [x] `short_name`: "Pippo"
- [x] `start_url`: "/dashboard"
- [x] `display`: "standalone"
- [x] `background_color`: "#ffffff"
- [x] `theme_color`: "#c0392b"
- [x] `scope`: "/"
- [x] Íconos referenciados: 192x192 y 512x512

### Íconos
- [ ] Crear íconos PNG 192x192 y 512x512 en `public/icons/`

### Meta tags en `<head>`
- [x] `manifest` en metadata de Next.js (`metadata.manifest = "/manifest.json"`)
- [ ] `<meta name="theme-color">` explícito
- [ ] `<meta name="apple-mobile-web-app-capable">`
- [ ] `<meta name="apple-mobile-web-app-status-bar-style">`
- [ ] Apple touch icon para iOS

### Service Worker
- [x] next-pwa genera `sw.js` automáticamente en build (deshabilitado en dev)

### Alcance de la PWA
- [x] La PWA aplica SOLO al panel admin (reportes, stock, productos)
- [x] El POS es desktop-only, no necesita PWA
- [x] La ruta `/display` tampoco necesita PWA

## Resultado esperado
Admin instala la app en su celular desde el navegador y puede acceder a reportes y alertas de stock directamente desde el homescreen.
