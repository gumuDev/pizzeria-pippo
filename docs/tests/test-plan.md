# Plan de Pruebas — Sistema de Restaurante de Pizza

## Cómo usar este documento

Cada módulo tiene dos tipos de pruebas:
- **Manual** — las haces tú en el navegador, marcas el checkbox cuando pasa
- **Playwright** — se automatizan, las corres con un comando y te dice si pasó o falló

El orden importa: sigue los módulos de arriba hacia abajo porque cada uno depende del anterior.

---

## MÓDULO 1 — Autenticación

### Manual
- [ ] Login con email y contraseña incorrectos → debe mostrar mensaje de error
- [ ] Login como admin → debe redirigir al dashboard
- [ ] Login como cajero → debe redirigir al POS
- [ ] Login como cocinero → debe redirigir a /kitchen
- [ ] Cajero intenta entrar a /dashboard manualmente por URL → debe ser bloqueado
- [ ] Cocinero intenta entrar a /pos manualmente por URL → debe ser bloqueado
- [ ] Cerrar sesión → redirige al login y no puede volver atrás con el botón del navegador

### Playwright (automatizable)
- Login exitoso por cada rol y verificar URL de destino
- Login fallido muestra error
- Acceso a ruta protegida sin sesión redirige al login
- Acceso a ruta de otro rol redirige correctamente

---

## MÓDULO 2 — Sucursales

### Manual
- [ ] Crear Sucursal A con nombre y dirección → aparece en la lista
- [ ] Crear Sucursal B
- [ ] Editar el nombre de una sucursal → se actualiza en toda la UI
- [ ] Intentar desactivar sucursal con cajeros activos → debe bloquear y mostrar aviso
- [ ] Desactivar sucursal sin cajeros activos → desaparece de selectores
- [ ] Reactivar una sucursal desactivada → vuelve a aparecer en selectores
- [ ] Ventas históricas de sucursal desactivada siguen visibles en reportes

### Playwright (automatizable)
- Crear sucursal y verificar que aparece en la lista
- Editar sucursal y verificar el cambio
- Desactivar sucursal con cajeros activos → verificar mensaje de bloqueo

---

## MÓDULO 3 — Insumos

### Manual
- [ ] Crear insumo "Tomate" con unidad "g" → aparece en la lista
- [ ] Crear insumos: Harina (g), Queso (g), Pepperoni (g), Aceite (ml), Coca Cola (unidad)
- [ ] Editar el nombre de un insumo → se refleja en las recetas existentes
- [ ] Intentar desactivar insumo que está en una receta activa → debe mostrar aviso
- [ ] Desactivar insumo sin recetas activas → desaparece del formulario de compras
- [ ] Reactivar insumo desactivado → vuelve a aparecer en formulario de compras y recetas

### Playwright (automatizable)
- Crear insumo y verificar que aparece en la lista
- Verificar que insumo desactivado no aparece en el selector de recetas

---

## MÓDULO 4 — Productos

### Manual

**Paso 1 — Datos generales:**
- [ ] Crear "Pizza Pepperoni" con categoría pizza, descripción e imagen
- [ ] Intentar guardar sin nombre → debe mostrar error de validación
- [ ] Subir imagen y verificar que se muestra la preview

**Paso 2 — Variantes y precios:**
- [ ] Agregar variante Personal Bs. 25, Mediana Bs. 40, Familiar Bs. 60
- [ ] Configurar precio distinto para Sucursal B en una variante
- [ ] Intentar agregar variante sin precio → debe mostrar error
- [ ] Verificar que el precio de Sucursal B se muestra distinto al base en el POS

**Paso 3 — Receta por variante:**
- [ ] Definir receta para "Pizza Mediana": harina 250g, tomate 150g, queso 180g
- [ ] Definir receta para "Pizza Personal" con cantidades distintas
- [ ] Verificar que si no hay insumos registrados el selector de receta está vacío
- [ ] Intentar guardar receta con cantidad 0 → debe mostrar error

**Soft delete:**
- [ ] Desactivar producto → desaparece del POS pero ventas históricas siguen en reportes
- [ ] Desactivar una variante → desaparece del POS, el producto sigue si tiene otras variantes activas
- [ ] Reactivar producto → vuelve a aparecer en el POS

### Playwright (automatizable)
- Crear producto completo (3 pasos) y verificar que aparece en el POS
- Verificar que producto desactivado no aparece en el POS
- Verificar precios distintos por sucursal en el POS

---

## MÓDULO 5 — Stock (Inventario)

### Manual

**Entrada de stock (compras):**
- [ ] Registrar compra: Tomate 1000g en Sucursal A → stock sube de 0 a 1000g
- [ ] Registrar segunda compra: Tomate 500g → stock sube a 1500g
- [ ] Compra queda registrada en historial con tipo "compra"
- [ ] Compra en Sucursal B no afecta el stock de Sucursal A

**Ajuste manual:**
- [ ] Ajustar Tomate Sucursal A a 1200g (era 1500g) → stock queda en 1200g
- [ ] Ajuste queda registrado en historial con tipo "ajuste"

**Alertas de stock bajo:**
- [ ] Configurar mínimo de Tomate en 500g
- [ ] Bajar el stock por debajo de 500g → aparece alerta en el dashboard

**Historial de movimientos:**
- [ ] Se listan: compras, ventas (automáticas al vender) y ajustes
- [ ] Filtrar movimientos por tipo → solo muestra el tipo seleccionado
- [ ] Filtrar por fecha → solo muestra movimientos del rango elegido

### Playwright (automatizable)
- Registrar compra y verificar que el stock aumenta correctamente
- Verificar que ajuste queda registrado en historial
- Verificar alerta cuando stock baja del mínimo

---

## MÓDULO 6 — Promociones

### Manual

**Creación:**
- [ ] Crear promo "2x1 domingos" tipo BUY_X_GET_Y, aplica a Pizza Mediana, días: domingo
- [ ] Crear promo "4+1 miércoles" tipo BUY_X_GET_Y, compra 4 llévate 5, días: miércoles
- [ ] Crear promo "20% descuento" tipo PERCENTAGE, aplica a Pizza Personal
- [ ] Intentar crear promo sin fechas de vigencia → debe mostrar error
- [ ] Crear promo solo para Sucursal A → no aparece en Sucursal B

**Vigencia:**
- [ ] Promo con fecha de fin en el pasado → no aparece en el POS
- [ ] Promo con fecha de inicio en el futuro → no aparece en el POS hoy

### Playwright (automatizable)
- Crear promo y verificar que aparece activa en el POS el día correcto
- Verificar que promo vencida no aparece en el POS
- Verificar que promo de Sucursal A no aparece en Sucursal B

---

## MÓDULO 7 — Punto de Venta (POS)

### Manual

**Apertura:**
- [ ] Cajero inicia sesión → sucursal aparece correctamente sin pedirla
- [ ] Productos con promo activa hoy tienen badge visible ("2x1")
- [ ] Productos sin promo no tienen badge

**Armar pedido:**
- [ ] Agregar Pizza Mediana x1 → aparece en el resumen con precio correcto
- [ ] Agregar Pizza Mediana x2 con promo 2x1 → descuento aplicado automáticamente
- [ ] El total es correcto (precio de 1 pizza, no 2)
- [ ] Agregar bebida sin promo → suma al total sin descuento
- [ ] Quitar un producto del pedido → el total se recalcula
- [ ] Limpiar el pedido completo → queda vacío

**Confirmar venta:**
- [ ] Confirmar pedido → aparece número de orden y confirmación
- [ ] Stock se descontó correctamente según la receta
- [ ] BUG A VERIFICAR: Pizza Mediana 2x1 → el stock debe descontar receta x2 (no x1)
- [ ] La venta aparece en "Pedidos del Día"
- [ ] La venta aparece en los reportes

**Pedidos del Día:**
- [ ] Órdenes ordenadas de la más reciente a la más antigua
- [ ] Solo aparecen órdenes de la sucursal del cajero
- [ ] Clic en una orden → se expande el detalle con productos y descuentos
- [ ] Resumen al pie muestra total de órdenes y total vendido correcto
- [ ] Órdenes pendientes de cocina muestran botón "Marcar listo"
- [ ] Al marcar listo → el botón desaparece y queda como completado

### Playwright (automatizable)
- Venta simple sin promo y verificar total
- Venta con promo 2x1 y verificar descuento aplicado
- Verificar descuento de stock correcto después de venta con promo
- Verificar que la venta aparece en "Pedidos del Día"

---

## MÓDULO 8 — Pantalla del Cliente (Display)

### Manual (no automatizable con Playwright — requiere dos ventanas)
- [ ] Abrir /display en una segunda ventana del mismo navegador
- [ ] En el POS agregar un producto → aparece en el display instantáneamente
- [ ] Agregar más productos → el display se actualiza en tiempo real
- [ ] Confirmar la venta → el display vuelve a mostrar el menú
- [ ] Sin pedido activo → el display muestra el menú con fotos y descripciones
- [ ] La descripción visible es la del cliente, no los gramos internos

---

## MÓDULO 9 — Kitchen Display (Cocina)

### Manual
- [ ] Cocinero inicia sesión → redirige a /kitchen
- [ ] Cajero confirma una venta → la tarjeta aparece en la tablet de cocina
- [ ] La tarjeta muestra: número de orden, hora, nombre del producto, tamaño, cantidad e ingredientes
- [ ] Los ingredientes muestran la descripción del cliente (ej: "Tomate, 4 quesos") NO los gramos
- [ ] Las tarjetas están ordenadas de la más antigua a la más nueva
- [ ] Una tarjeta con más de 10 minutos se resalta en rojo
- [ ] Cajero marca "Marcar listo" en el POS → la tarjeta desaparece de la cocina
- [ ] La cocina solo muestra pedidos de su sucursal

### Playwright (automatizable)
- Confirmar venta y verificar que aparece en /kitchen
- Marcar listo desde el POS y verificar que desaparece de /kitchen
- Verificar que pedidos de Sucursal B no aparecen en kitchen de Sucursal A

---

## MÓDULO 10 — Reportes

### Manual
- [ ] Reporte muestra columnas: unidades físicas, precio bruto, descuento, cobrado
- [ ] Venta con 2x1: unidades físicas = 2, cobrado = precio de 1
- [ ] Filtrar por Sucursal A → solo muestra ventas de Sucursal A
- [ ] Filtrar por Sucursal B → solo muestra ventas de Sucursal B
- [ ] Filtrar consolidado → muestra suma de ambas sucursales
- [ ] Filtrar por hoy / semana / mes → los datos cambian correctamente
- [ ] Sección de promociones: cuántas veces se usó cada promo y el monto descontado
- [ ] El total cobrado en el reporte coincide con la suma real de las ventas

### Playwright (automatizable)
- Hacer ventas y verificar que el reporte las refleja correctamente
- Verificar filtro por sucursal aísla correctamente los datos
- Verificar que descuentos aparecen desglosados

---

## MÓDULO 11 — Soft Delete (Transversal)

### Manual
- [ ] Desactivar sucursal → ventas históricas siguen visibles en reportes
- [ ] Desactivar producto → ventas históricas siguen en reportes con el nombre correcto
- [ ] Desactivar insumo → movimientos históricos siguen en el historial
- [ ] Ninguna tabla histórica permite DELETE físico desde la UI

---

## Bugs Conocidos a Verificar

Identificados durante el análisis, deben tener prueba específica:

| # | Bug | Cómo verificar |
|---|---|---|
| B1 | Stock se descuenta por unidades cobradas en vez de físicas | Venta 2x1: verificar que se descontó receta x2 del stock |
| B2 | Reporte no muestra desglose de descuentos | Verificar columnas: precio bruto, descuento y cobrado |

---

## Orden de Ejecución Recomendado

```
1.  Autenticación     → base de todo
2.  Sucursales        → necesario para todo lo demás
3.  Insumos           → necesario antes de crear productos
4.  Productos         → necesario para el POS
5.  Stock             → configurar stock inicial
6.  Promociones       → configurar promos
7.  POS               → prueba central del sistema
8.  Display cliente   → prueba visual manual
9.  Kitchen Display   → requiere POS funcionando
10. Reportes          → requiere ventas registradas
11. Soft delete       → prueba transversal al final
```