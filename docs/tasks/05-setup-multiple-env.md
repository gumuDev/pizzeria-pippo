# TASK — Configurar entornos local y producción

**Objetivo:** Poder levantar el proyecto apuntando a Supabase local o Supabase cloud con un solo comando.

---

## Subtareas

### 1. Crear los archivos de entorno

**`.env.local`** — apunta a Supabase local:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # ANON_KEY de tu Supabase local
SUPABASE_SERVICE_ROLE_KEY=        # SERVICE_ROLE_KEY de tu Supabase local
```

**`.env.production`** — apunta a Supabase cloud:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # del dashboard de Supabase
SUPABASE_SERVICE_ROLE_KEY=        # del dashboard de Supabase
```

**`.env.example`** — plantilla sin valores (este SÍ va a git):
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 2. Actualizar `.gitignore`
Agregar:
```
.env.local
.env.production
.env*.local
```

### 3. Agregar scripts a `package.json`
```json
"dev":          "next dev",
"dev:prod":     "dotenv -e .env.production -- next dev",
"build":        "next build",
"build:local":  "dotenv -e .env.local -- next build"
```

Instalar la dependencia necesaria:
```bash
npm install dotenv-cli --save-dev
```

Con esto los comandos quedan así:

| Comando | Entorno |
|---|---|
| `npm run dev` | Supabase local |
| `npm run dev:prod` | Supabase cloud |
| `npm run build` | Supabase cloud |
| `npm run build:local` | Supabase local |

---

## Definition of Done
- [ ] `npm run dev` conecta a Supabase local
- [ ] `npm run dev:prod` conecta a Supabase cloud
- [ ] Ningún archivo `.env` con valores reales está commiteado al repo