import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

// ---------------------------------------------------------------------------
// Módulo 02 — Sucursales
// Ref: docs/tests/automation/02-branches.md
// ---------------------------------------------------------------------------

// Nombre único por ejecución para evitar colisiones entre runs
const RUN_ID = Date.now();
const BRANCH_NAME = `Sucursal Playwright ${RUN_ID}`;
const BRANCH_NAME_EDITED = `Sucursal Playwright Editada ${RUN_ID}`;

test.describe("Sucursales", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin");
    await page.goto("/branches");
    await page.waitForLoadState("networkidle");
  });

  test("crear sucursal → aparece en la lista", async ({ page }) => {
    await page.getByRole("button", { name: "Nueva sucursal" }).click();
    await page.getByLabel("Nombre").fill(BRANCH_NAME);
    await page.getByLabel("Dirección").fill("Av. Test 123");
    await page.getByRole("button", { name: "Crear sucursal" }).click();

    // Modal se cierra y la sucursal aparece en la tabla
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("cell", { name: BRANCH_NAME })).toBeVisible();
  });

  test("editar nombre de sucursal → cambio se refleja en la tabla", async ({ page }) => {
    // Buscar la fila de la sucursal creada en el test anterior
    const row = page.getByRole("row", { name: new RegExp(BRANCH_NAME) });
    await row.getByRole("button").first().click(); // botón editar (EditOutlined)

    await page.getByLabel("Nombre").clear();
    await page.getByLabel("Nombre").fill(BRANCH_NAME_EDITED);
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("cell", { name: BRANCH_NAME_EDITED })).toBeVisible();
  });

  test("desactivar sucursal con cajeros activos → muestra modal de bloqueo", async ({ page }) => {
    // Sucursal A tiene cajeros asignados en el sistema
    const row = page.getByRole("row", { name: /Sucursal A/ });
    await row.getByTitle("Desactivar").click();

    await expect(
      page.getByRole("dialog", { name: "No se puede desactivar la sucursal" })
    ).toBeVisible({ timeout: 6000 });

    // El modal lista los cajeros asignados
    await expect(page.getByRole("dialog").locator("ul li").first()).toBeVisible();
  });
});
