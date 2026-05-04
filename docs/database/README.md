# Base de Datos — Pizzería Pippo

## Archivos

```
docs/database/
├── schema-base.sql          ← Schema real actual (exportado de Supabase, solo referencia)
├── README.md                ← Este archivo
└── migrations/
    ├── 002_soft_delete.sql              ← is_active en branches/ingredients/products/variants/promotions
    ├── 003_order_items_qty_physical.sql ← qty_physical para BUY_X_GET_Y
    ├── 004_orders_kitchen_status.sql    ← kitchen_status para KDS
    └── 005_profiles_cocinero_role.sql   ← rol cocinero + RLS kitchen update
```

> El schema inicial es `supabase/001_schema.sql`. Las migraciones acá documentan
> cada cambio aplicado después de ese schema base.

## Convención de nombres

```
NNN_descripcion_corta.sql
```

- `NNN` — número secuencial de 3 dígitos, empieza en `002` (el `001` es el schema inicial)
- `descripcion_corta` — snake_case, describe el cambio principal

## Reglas

1. **Nunca modificar `001_schema.sql`** — ese archivo refleja el estado inicial del proyecto.
2. **Cada cambio en la BD genera un archivo nuevo** en `migrations/` antes de aplicarlo en Supabase.
3. **`schema-base.sql` se actualiza** después de aplicar cada migración para reflejar el estado real actual.
4. Los archivos de migración son solo documentación/referencia — **no se ejecutan automáticamente**.
   Cada uno se aplica manualmente en el SQL Editor de Supabase.
5. Si un cambio ya fue aplicado en Supabase pero no estaba documentado, igual se crea el archivo
   con una nota `-- Ya aplicado en Supabase el YYYY-MM-DD`.

## Checklist obligatorio al crear una tabla nueva

Toda migración que cree una tabla nueva debe incluir estos tres bloques además del `CREATE TABLE`:

```sql
-- 1. Habilitar RLS
ALTER TABLE public.nueva_tabla ENABLE ROW LEVEL SECURITY;

-- 2. GRANT a los roles de Supabase (sin esto da "permission denied" aunque RLS esté bien)
GRANT ALL ON TABLE public.nueva_tabla TO authenticated;
GRANT ALL ON TABLE public.nueva_tabla TO service_role;

-- 3. Políticas RLS usando get_user_role() (no hacer JOIN directo a profiles)
CREATE POLICY "admin_select_nueva_tabla"
  ON public.nueva_tabla FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "admin_insert_nueva_tabla"
  ON public.nueva_tabla FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "admin_update_nueva_tabla"
  ON public.nueva_tabla FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "admin_delete_nueva_tabla"
  ON public.nueva_tabla FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');
```

> **Importante:** Usar siempre `get_user_role()` en las políticas, nunca un `EXISTS (SELECT 1 FROM profiles ...)` directo.
> El `EXISTS` directo causa ciclos de RLS y falla silenciosamente.
> El `GRANT` es independiente de RLS — sin él Postgres bloquea el acceso antes de evaluar las políticas.
