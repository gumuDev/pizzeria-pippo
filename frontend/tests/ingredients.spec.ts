import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

// ---------------------------------------------------------------------------
// Módulo 03 — Insumos
// Ref: docs/tests/automation/03-ingredients.md
// ---------------------------------------------------------------------------

test.describe("Insumos", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin");
    await page.goto("/ingredients");
    await page.waitForLoadState("networkidle");
  });

  test("crear insumo → aparece en la lista", async ({ page }) => {
    const name = `Insumo Playwright ${Date.now()}`;

    await page.getByRole("button", { name: /Nuevo insumo|Nuevo/ }).click();

    await page.getByLabel("Nombre").fill(name);

    // Select de Ant Design: click en el trigger, luego en la opción del dropdown
    await page.getByLabel("Unidad de medida").click();
    await page.locator(".ant-select-dropdown:visible .ant-select-item-option-content", { hasText: "Gramos (g)" }).click();

    await page.getByRole("button", { name: "Crear insumo" }).click();

    // Modal se cierra
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

    // El insumo aparece en la tabla
    await expect(page.getByText(name)).toBeVisible({ timeout: 6000 });
  });

  test("desactivar insumo → no aparece en el selector de recetas", async ({ page }) => {
    const name = `Insumo Playwright ${Date.now()}`;

    // Crear el insumo (independiente del test anterior)
    await page.getByRole("button", { name: /Nuevo insumo|Nuevo/ }).click();
    await page.getByLabel("Nombre").fill(name);
    await page.getByLabel("Unidad de medida").click();
    await page.locator(".ant-select-dropdown:visible .ant-select-item-option-content", { hasText: "Gramos (g)" }).click();
    await page.getByRole("button", { name: "Crear insumo" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(name)).toBeVisible({ timeout: 6000 });

    // Filtrar para que solo quede esa fila y desactivar
    await page.getByPlaceholder("Buscar por nombre...").fill(name);
    await page.waitForTimeout(600); // debounce de búsqueda
    await expect(page.getByRole("row")).toHaveCount(2); // header + 1 fila

    // El segundo botón de la fila es "desactivar"
    await page.getByRole("row").nth(1).getByRole("button").nth(1).click();

    // Ir al formulario de nuevo producto
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /Nuevo producto|Nuevo/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Paso 1: Sucursal
    await page.getByLabel("Sucursal").click();
    await page.locator(".ant-select-dropdown:visible .ant-select-item").first().click();
    await expect(page.locator(".ant-select-dropdown")).not.toBeVisible({ timeout: 3000 });

    // Nombre
    await page.getByLabel("Nombre").fill(`Producto Test ${Date.now()}`);

    // Categoría
    await page.getByLabel("Categoría").click();
    await page.locator(".ant-select-dropdown:visible .ant-select-item").first().click();
    await expect(page.locator(".ant-select-dropdown")).not.toBeVisible({ timeout: 3000 });

    await page.getByRole("button", { name: "Siguiente" }).click();

    // Paso 2: variante por defecto → solo avanzar
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Siguiente" }).click();

    // Paso 3: abrir selector de insumo
    await page.getByRole("button", { name: "Agregar insumo" }).first().click();
    await page.getByPlaceholder("Insumo").first().click();

    // El insumo desactivado NO debe aparecer en las opciones
    await expect(
      page.locator(".ant-select-dropdown:visible").getByText(name)
    ).not.toBeVisible({ timeout: 5000 });
  });
});
