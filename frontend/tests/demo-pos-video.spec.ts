import { test, expect, type Page } from "@playwright/test";
import { credentials } from "./helpers/auth";

// ---------------------------------------------------------------------------
// Video demo del POS para mostrarle al cliente el flujo de venta completo:
// una venta por cada método de pago soportado (efectivo, QR, mixto, online).
// No es un test de regresión (no corre en CI) — es un script que recorre el
// golden path de cada método a un ritmo legible y superpone subtítulos de
// texto en cada paso, para que el video se explique solo sin necesidad de
// grabar audio ni editar nada después.
//
// La validación automática de QR (matcheo contra el SMS/webhook de Yape) no
// se simula acá — cada venta se confirma manualmente, igual que hace un
// cajero cuando no usa esa validación.
//
// Correr con:
//   npx playwright test demo-pos-video --headed
// El video queda en test-results/demo-pos-video-*/video.webm
// ---------------------------------------------------------------------------

test.use({ video: "on" });

async function caption(page: Page, text: string, ms = 2200) {
  await page.evaluate((text) => {
    let el = document.getElementById("__demo_caption__");
    if (!el) {
      el = document.createElement("div");
      el.id = "__demo_caption__";
      Object.assign(el.style, {
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(17,24,39,0.88)",
        color: "#fff",
        padding: "10px 22px",
        borderRadius: "999px",
        fontSize: "18px",
        fontFamily: "system-ui, sans-serif",
        fontWeight: "600",
        zIndex: "999999",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        pointerEvents: "none",
      } as CSSStyleDeclaration);
      document.body.appendChild(el);
    }
    el.textContent = text;
  }, text);
  await page.waitForTimeout(ms);
}

async function addProductToCart(page: Page) {
  const productCard = page.locator('div[style*="grid-template-columns"] > div').first();
  await productCard.waitFor({ state: "visible", timeout: 15000 });
  await productCard.click();

  // Si el producto tiene una sola variante, el POS lo agrega directo al
  // carrito sin abrir el modal de selección (ver usePosPageActions.ts:42) —
  // por eso el modal se espera con timeout corto en vez de asumir que siempre aparece.
  const modalBody = page.locator(".ant-modal-body");
  const modalAppeared = await modalBody
    .waitFor({ state: "visible", timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (modalAppeared) {
    const isPizza = await modalBody.getByText("Tamaño", { exact: true }).isVisible().catch(() => false);
    if (isPizza) {
      await modalBody.locator('div[style*="grid-template-columns"] button').first().click();
      await modalBody.getByRole("button", { name: /Agregar/ }).click();
    } else {
      await modalBody.getByRole("button").first().click();
    }
  }
  await expect(page.getByRole("button", { name: "Confirmar venta" })).toBeEnabled({ timeout: 8000 });
}

async function confirmAndCollect(page: Page) {
  await expect(page.getByText("Revisar y confirmar")).toBeVisible();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/orders") && r.request().method() === "POST"),
    page.getByRole("button", { name: "Confirmar y cobrar" }).click(),
  ]);
  await expect(page.getByText("Venta confirmada")).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Nueva venta" }).click();
}

interface PaymentScenario {
  title: string;
  selectPayment: (page: Page) => Promise<void>;
}

const scenarios: PaymentScenario[] = [
  {
    title: "Escenario 1: pago en efectivo",
    selectPayment: async (page) => {
      await page.getByText("Comer aquí", { exact: true }).click();
      await page.getByText("Efectivo", { exact: true }).click();
    },
  },
  {
    title: "Escenario 2: pago por QR",
    selectPayment: async (page) => {
      await page.getByText("Para llevar", { exact: true }).click();
      await page.getByText("QR", { exact: true }).click();
    },
  },
  {
    title: "Escenario 3: pago mixto (efectivo + QR)",
    selectPayment: async (page) => {
      await page.getByText("Comer aquí", { exact: true }).click();
      // Al elegir "Mixto" la app precarga automáticamente la mitad del total
      // en efectivo (cashAmount = total/2) — ya es un split válido sin
      // importar el precio del producto, así que no hace falta tocar el
      // input (escribir un monto fijo como "10" podía superar el total de
      // un producto barato y dejar el QR en negativo).
      await page.getByText("Mixto", { exact: true }).click();
      await page.waitForTimeout(400);
    },
  },
  {
    title: "Escenario 4: pedido online (pago ya recibido)",
    selectPayment: async (page) => {
      // El checkbox online fuerza "para llevar" y no requiere elegir método —
      // las secciones de tipo de pedido/pago quedan deshabilitadas. Se acota
      // al modal porque React Scan (herramienta de dev) agrega su propio
      // checkbox flotante fuera del modal ("Outline Re-renders").
      await page.locator(".ant-modal-body").getByRole("checkbox").click();
    },
  },
];

test("recorrido de venta en el POS — video demo de los 4 métodos de pago", async ({ page }) => {
  test.setTimeout(180_000);

  // React Scan (herramienta de dev, gateada a NODE_ENV=development) inyecta
  // una barra flotante con FPS/notificaciones que no queremos en el video —
  // se bloquea solo para esta grabación, sin tocar layout.tsx.
  await page.route(/react-scan/, (route) => route.abort());

  // Login como cajero
  const { email, password } = credentials.cajero;
  await page.goto("/login");
  await caption(page, "Iniciando sesión como cajero", 1500);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL("**/pos", { timeout: 15000 });
  await caption(page, "Este es el catálogo de productos del POS");

  for (const scenario of scenarios) {
    await caption(page, scenario.title, 1800);

    await caption(page, "Agregando un producto al carrito");
    await addProductToCart(page);

    await caption(page, "Abriendo el cobro de la venta");
    await page.getByRole("button", { name: "Confirmar venta" }).click();
    await expect(page.getByText("Tipo de pedido y pago")).toBeVisible();

    await scenario.selectPayment(page);
    await page.waitForTimeout(500);

    await caption(page, "Continuando al resumen de la venta");
    await page.getByRole("button", { name: "Continuar" }).click();

    await caption(page, "Confirmando y cobrando la venta", 800);
    await confirmAndCollect(page);

    await caption(page, "¡Venta confirmada!", 2200);
  }
});
