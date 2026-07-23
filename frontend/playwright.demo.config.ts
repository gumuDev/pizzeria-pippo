import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.test' });

// Config aparte solo para grabar el video demo del POS — corre en Chromium
// (más estable que el Firefox de playwright.config.ts para sesiones largas
// con grabación de video) sin tocar la config compartida del resto de tests.
export default defineConfig({
  testDir: './tests',
  testMatch: 'demo-pos-video.spec.ts',
  timeout: 180_000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
  },
  projects: [
    {
      name: 'chromium-demo',
      use: {
        ...devices['Desktop Chrome'],
        // Todo en el mismo bloque (proyecto) para no depender de cómo se
        // combine con el `use` de arriba. Viewport igual al tamaño del
        // video (para que no se recorte) y deviceScaleFactor 2: Chromium
        // renderiza al doble de densidad y Playwright lo reduce al tamaño
        // final del video, dando más nitidez que grabar 1:1.
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
        // El grabador interno de Playwright siempre baja a 800x450 sin
        // importar el tamaño pedido (límite interno, no de config) — se
        // graba la pantalla con ffmpeg en paralelo en su lugar.
        video: 'off',
      },
    },
  ],
});
