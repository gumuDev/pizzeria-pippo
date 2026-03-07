# Pruebas Manuales — Módulo 4: Productos

## Paso 1 — Datos generales

- [ ] Crear "Pizza Pepperoni" con categoría pizza, descripción e imagen
- [ ] Intentar guardar sin nombre → debe mostrar error de validación
- [ ] Subir imagen y verificar que se muestra la preview

## Paso 2 — Variantes y precios

- [ ] Agregar variante Personal Bs. 25, Mediana Bs. 40, Familiar Bs. 60
- [ ] Configurar precio distinto para Sucursal B en una variante
- [ ] Intentar agregar variante sin precio → debe mostrar error
- [ ] Verificar que el precio de Sucursal B se muestra distinto al base en el POS

## Paso 3 — Receta por variante

- [ ] Definir receta para "Pizza Mediana": harina 250g, tomate 150g, queso 180g
- [ ] Definir receta para "Pizza Personal" con cantidades distintas
- [ ] Verificar que si no hay insumos registrados el selector de receta está vacío
- [ ] Intentar guardar receta con cantidad 0 → debe mostrar error

## Soft delete

- [ ] Desactivar producto → desaparece del POS pero ventas históricas siguen en reportes
- [ ] Desactivar una variante → desaparece del POS, el producto sigue si tiene otras variantes activas
- [ ] Reactivar producto → vuelve a aparecer en el POS
