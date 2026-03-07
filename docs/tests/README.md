# Plan de Pruebas — Pizzería Pippo

## Estructura

```
docs/tests/
├── README.md          ← Este archivo
├── manual/            ← Pruebas que se ejecutan en el navegador manualmente
│   ├── 01-auth.md
│   ├── 02-branches.md
│   ├── 03-ingredients.md
│   ├── 04-products.md
│   ├── 05-stock.md
│   ├── 06-promotions.md
│   ├── 07-pos.md
│   ├── 08-display.md     ← Solo manual (requiere dos ventanas)
│   ├── 09-kitchen.md
│   ├── 10-reports.md
│   └── 11-soft-delete.md ← Prueba transversal
└── automation/        ← Casos a automatizar con Playwright
    ├── 01-auth.md
    ├── 02-branches.md
    ├── 03-ingredients.md
    ├── 04-products.md
    ├── 05-stock.md
    ├── 06-promotions.md
    ├── 07-pos.md
    ├── 09-kitchen.md
    └── 10-reports.md
```

> El Módulo 8 (Display cliente) no tiene automation — requiere dos ventanas del mismo navegador
> y comunicación via BroadcastChannel, lo que no es compatible con Playwright.
>
> El Módulo 11 (Soft delete) es transversal y se cubre dentro de los tests de cada módulo.

## Orden de ejecución recomendado

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

## Bugs conocidos a verificar

| # | Bug | Módulo | Cómo verificar |
|---|-----|--------|----------------|
| B1 | Stock se descuenta por unidades cobradas en vez de físicas | POS / Stock | Venta 2x1: verificar que se descontó receta x2 del stock |
| B2 | Reporte no muestra desglose de descuentos | Reportes | Verificar columnas: precio bruto, descuento y cobrado |
