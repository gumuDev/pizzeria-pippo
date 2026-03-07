# 08 — Pantalla Secundaria del Cliente (Display)

## Objetivo
Segunda pantalla en monitor secundario que muestra el pedido en tiempo real mientras el cajero lo arma, y el menú cuando no hay pedido activo.

## Archivos creados
- `src/app/display/page.tsx` — pantalla pública fullscreen

## Tareas

### Página display (`app/display/page.tsx`)
- [x] Ruta pública (no requiere login)
- [x] Diseño fullscreen optimizado para monitor secundario (h-screen, fondo oscuro)
- [x] Tres modos: **menú**, **pedido**, **gracias**

### Comunicación via BroadcastChannel
- [x] Canal: `pos-display`
- [x] `CART_UPDATE` → cambia a modo pedido con ítems y total
- [x] `CART_CLEAR` → vuelve a modo menú
- [x] `ORDER_COMPLETE` → muestra "¡Gracias!" 3 segundos, luego modo menú

### Modo menú (sin pedido activo)
- [x] Grid 3 columnas, 6 productos por página
- [x] Auto-rotación cada 6 segundos si hay más de 6 productos
- [x] Indicador de página (dots) con animación
- [x] Imagen del producto o emoji fallback por categoría
- [x] Nombre, descripción del cliente, precio (desde Bs X si tiene variantes)
- [x] Tabs de categorías en header
- [x] NO muestra gramos ni info de recetas internas

### Modo pedido (cajero armando orden)
- [x] Lista de ítems: cantidad, nombre, variante, badge de promo, subtotal
- [x] Precio tachado si tiene descuento
- [x] Panel derecho con total en grande (Bs XX)
- [x] Badge verde "Ahorrás Bs X" si hay descuentos aplicados

### Modo gracias
- [x] Pantalla centrada con emoji + "¡Gracias!" en naranja
- [x] Vuelve automáticamente al modo menú después de 3 segundos

### Instrucciones de uso
- Abrir `http://localhost:3000/display` en una segunda ventana del navegador
- Arrastrar esa ventana al monitor secundario y poner en pantalla completa (F11)
- Debe estar abierta en el **mismo navegador y mismo equipo** que el POS (BroadcastChannel es local)

## Resultado esperado
Cliente ve su pedido en tiempo real sin que el cajero haga nada extra. Comunicación instantánea sin internet ni WebSockets.
