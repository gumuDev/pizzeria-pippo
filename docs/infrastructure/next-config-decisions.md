# next.config.mjs — Decisiones y gotchas

## Images — remotePatterns

```js
remotePatterns: [
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
]
```

**Por qué wildcard y no el hostname exacto:**
El ID del proyecto Supabase está en `NEXT_PUBLIC_SUPABASE_URL` (`.env.local`), pero
`next.config.mjs` se ejecuta en **build time** — las variables de entorno no están
disponibles para `remotePatterns` en ese momento. Next.js necesita conocer los
hostnames permitidos al compilar, no en runtime.

Usar el hostname fijo (ej. `kewrgrmyeisiruteuhnd.supabase.co`) rompe la app si:
- Se migra a otro proyecto Supabase
- Se usan entornos distintos (dev/staging/prod) con proyectos distintos
- El ID del proyecto cambia por cualquier motivo

**¿Es seguro el wildcard?**
Sí — el `pathname` sigue restringido a `/storage/v1/object/public/**`, que es el
bucket público de Supabase. No permite imágenes de dominios arbitrarios.

**No cambiar esto** a un hostname hardcodeado aunque parezca más explícito.

---

## Build time vs runtime

Variables en `.env.local` con prefijo `NEXT_PUBLIC_*` están disponibles en el
**bundle del cliente** (runtime), pero `next.config.mjs` se evalúa antes del
bundle — intentar leer `process.env.NEXT_PUBLIC_SUPABASE_URL` ahí retorna
`undefined` durante el build en CI o en máquinas sin el `.env.local` cargado.

---

## Plugins activos

| Plugin | Config |
|--------|--------|
| `next-pwa` | SW en `public/`, deshabilitado en desarrollo |
| `next-intl` | Locale default: español |
| `@next/bundle-analyzer` | Solo activo con `ANALYZE=true` (`npm run analyze`) |
