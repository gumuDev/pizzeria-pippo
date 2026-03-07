# 04 — Insumos

## Objetivo
Panel admin para gestionar insumos (ingredientes). Debe completarse antes que productos porque las recetas dependen de insumos existentes.

> **Prioridad:** Paso 2 del orden de configuración inicial. Sin insumos no se pueden definir recetas en el registro de productos.

## Tareas

### Listado de insumos (`app/(admin)/ingredients/page.tsx`)
- [x] Tabla con columnas: nombre, unidad de medida, acciones
- [x] Botón "Nuevo insumo"
- [x] Acciones: editar, eliminar

### Formulario crear/editar insumo
- [x] Campo: nombre del insumo
- [x] Campo: unidad de medida (select: g / kg / ml / l / unidad)
- [x] Validación: nombre requerido, unidad requerida
- [x] Guardar en tabla `ingredients`

### Eliminar insumo
- [x] Confirmación con advertencia de cascada (stock y recetas)

### API / Data layer
- [x] Usa Refine + Supabase data provider directamente

## Resultado esperado ✅
Admin puede registrar todos los insumos con su unidad antes de crear productos.
