import { Page } from "@playwright/test";

export const credentials = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  },
  cajero: {
    email: process.env.TEST_CAJERO_EMAIL!,
    password: process.env.TEST_CAJERO_PASSWORD!,
  },
  cocinero: {
    email: process.env.TEST_COCINERO_EMAIL!,
    password: process.env.TEST_COCINERO_PASSWORD!,
  },
};

export async function login(page: Page, role: keyof typeof credentials) {
  const { email, password } = credentials[role];
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  // Espera a que la navegación post-login termine
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 10000,
  });
}

export async function logout(page: Page) {
  // Limpiar storage del browser para invalidar la sesión de Supabase
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
