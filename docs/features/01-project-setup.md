# 01 — Project Setup

## Objetivo
Inicializar el proyecto con todas las dependencias y configuración base lista para desarrollar.

## Tareas

### Next.js + TypeScript
- [x] Crear proyecto con `npx create-next-app@14` (App Router, TypeScript, Tailwind)
- [x] Configurar `tsconfig.json` con paths alias (`@/`)
- [x] Verificar que corre en `localhost:3000`

### Dependencias principales
- [x] Instalar Refine (`@refinedev/core`, `@refinedev/nextjs-router`, `@refinedev/antd`)
- [x] Instalar Ant Design (`antd`)
- [x] Instalar Supabase (`@supabase/supabase-js`, `@refinedev/supabase`)
- [x] Instalar next-intl (i18n)
- [x] Instalar next-pwa

### Configuración Supabase
- [x] Crear proyecto en Supabase (o usar existente)
- [x] Completar `.env.local` con credenciales reales:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] Crear `src/lib/supabase.ts` con cliente Supabase

### Estructura de carpetas
- [x] Crear estructura base de `app/`:
  - `app/(admin)/`
  - `app/(pos)/`
  - `app/display/`
  - `app/api/`
- [x] Crear carpetas `components/` y `lib/`

### Refine setup
- [x] Configurar `<Refine>` provider en layout de admin
- [x] Conectar data provider de Supabase
- [x] Verificar que Refine levanta sin errores

### Tailwind
- [x] Confirmar que Tailwind está configurado
- [x] Limpiar `globals.css` para evitar conflictos con Ant Design

### i18n con next-intl
- [x] Instalar `next-intl`
- [x] Crear `messages/es.json` — español (default)
- [x] Crear `messages/en.json` — inglés
- [x] Configurar `src/i18n/request.ts` — locale por cookie, default `es`
- [x] Envolver la app con `NextIntlClientProvider` en `layout.tsx`
- [x] Configurar `middleware.ts` (sin prefijo de URL, locale por cookie)

### PWA
- [x] Configurar `next.config.mjs` con `next-pwa` + `next-intl`
- [x] Crear `public/manifest.json` con nombre, íconos y colores
- [ ] Agregar íconos PWA: `public/icons/icon-192x192.png` y `icon-512x512.png`
- [ ] Verificar que `sw.js` se genera en build (solo en producción)

## Pendiente del usuario
- [ ] Proveer íconos PWA en `public/icons/`

## Resultado esperado
Proyecto corriendo en local con Refine + Ant Design + Supabase conectado, estructura de carpetas lista.
