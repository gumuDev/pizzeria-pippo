# 04 — Catálogo de Productos

## Objetivo
Panel admin para crear, editar y eliminar productos con variantes, precios por sucursal e imagen.

> **Dependencia:** Los insumos (fase 05) deben estar registrados antes de poder definir recetas en el Paso 3. El orden de configuración inicial es: sucursales → insumos → productos → stock.

## Tareas

### Listado de productos (`app/(admin)/products/page.tsx`)
- [x] Tabla con columnas: imagen, nombre, categoría, variantes, acciones
- [x] Filtro por categoría (pizza / bebida / otro)
- [x] Botón "Nuevo producto" que abre el formulario en 3 pasos

### Formulario — Paso 1: Datos generales
- [x] Campo: sucursal (selector obligatorio — aplica a todo el producto)
- [x] Campo: nombre del producto
- [x] Campo: categoría (select: pizza / bebida / otro)
- [x] Campo: descripción para el cliente (textarea)
- [x] Campo: imagen (upload a Supabase Storage, preview inmediato)
- [x] Valores guardados en estado `step1Data` al avanzar (evita pérdida al desmontar el form)

### Formulario — Paso 2: Variantes y precios
- [x] Agregar variantes dinámicamente: Personal / Mediana / Familiar
- [x] Por cada variante: precio en Bs (vinculado automáticamente a la sucursal seleccionada)
- [x] Selector de variante filtra opciones ya usadas
- [x] Banner recordatorio con la sucursal seleccionada
- [x] Validar que al menos haya 1 variante

### Formulario — Paso 3: Receta por variante
- [x] Por cada variante creada en Paso 2, mostrar sección de receta
- [x] Selector de insumo + campo cantidad
- [x] Agregar múltiples insumos por variante
- [x] Guardar en tabla `recipes`

### API routes
- [x] `GET /api/products` — lista productos con variantes
- [x] `POST /api/products` — crea producto + variantes + precios + recetas
- [x] `PUT /api/products/[id]` — edita producto
- [x] `DELETE /api/products/[id]` — elimina producto (y variantes/recetas en cascada)
- [x] Autenticación via header `Authorization: Bearer <token>` en todas las routes

### Upload de imágenes
- [x] Subir imagen al bucket `product-images` en Supabase Storage
- [x] Guardar URL pública en `products.image_url`
- [x] Al editar: opción de reemplazar imagen

### Editar producto
- [x] Formulario precargado con datos actuales
- [x] Puede agregar/quitar variantes
- [x] Puede modificar recetas

### Eliminar producto
- [x] Confirmación antes de eliminar
- [x] Eliminar en cascada: variantes, precios, recetas

### RLS (Supabase)
- [x] Políticas de escritura separadas por operación: `INSERT` con `WITH CHECK`, `UPDATE`/`DELETE` con `USING`
- [x] `get_user_role() = 'admin'` requerido para todas las operaciones de escritura

## Resultado esperado
Admin puede crear y gestionar productos completos con variantes, precios en Bs por sucursal y recetas internas.
