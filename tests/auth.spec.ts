import { test, expect } from "@playwright/test";
import { login, credentials } from "./helpers/auth";

// ---------------------------------------------------------------------------
// Módulo 01 — Autenticación
// Ref: docs/tests/automation/01-auth.md
// ---------------------------------------------------------------------------

test.describe("Login exitoso por rol", () => {
  test("admin → redirige a /dashboard", async ({ page }) => {
    await login(page, "admin");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("cajero → redirige a /pos", async ({ page }) => {
    await login(page, "cajero");
    await expect(page).toHaveURL(/\/pos/);
  });

  test("cocinero → redirige a /kitchen", async ({ page }) => {
    await login(page, "cocinero");
    await expect(page).toHaveURL(/\/kitchen/);
  });
});

test.describe("Login fallido", () => {
  test("credenciales inválidas → muestra mensaje de error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("noexiste@test.com");
    await page.getByLabel("Contraseña").fill("passwordincorrecto");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(
      page.getByText("Credenciales incorrectas")
    ).toBeVisible({ timeout: 8000 });

    // Sigue en /login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Protección de rutas sin sesión", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("acceso a /dashboard sin sesión → redirige al login", async ({ browser }) => {
    // Contexto nuevo y aislado — sin localStorage ni cookies de tests anteriores
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(\?to=.*)?$/, { timeout: 12000 });

    await context.close();
  });

  test("acceso a /kitchen sin sesión → redirige al login", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    await page.goto("/kitchen");
    await expect(page).toHaveURL(/\/login/, { timeout: 12000 });

    await context.close();
  });
});

test.describe("Protección de rutas por rol cruzado", () => {
  test("cajero accede a /kitchen → redirige al login", async ({ page }) => {
    await login(page, "cajero");
    await page.goto("/kitchen");
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test("cocinero accede a /pos → la página no carga contenido protegido", async ({ page }) => {
    await login(page, "cocinero");
    await page.goto("/pos");
    // El POS redirecciona internamente; esperamos que no muestre el catálogo de productos
    await expect(page.getByText("Catálogo")).not.toBeVisible({ timeout: 6000 });
  });
});
