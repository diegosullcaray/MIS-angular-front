import { defineConfig, devices } from '@playwright/test';

const PUERTO = 4300;
const BASE_URL = `http://localhost:${PUERTO}`;

/**
 * Configuración de Playwright para los E2E del Host.
 *
 * El servidor de desarrollo se levanta con `npm start` (ng serve) — igual
 * que cualquier desarrollador o el pipeline de CI harían. Los tests nunca
 * dependen de un backend Ant/Winder ni de Google real: cada spec que
 * necesita una sesión autenticada la inyecta directamente en
 * `sessionStorage` (ver `e2e/fixtures/session.ts`) y mockea las llamadas al
 * backend con `page.route()`, así el shell renderiza igual sin red externa.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Opcional: solo para entornos donde el Chromium instalado no coincide
    // con la revisión que espera esta versión de @playwright/test (p. ej.
    // contenedores con un binario preinstalado en una ruta fija). En una
    // máquina normal esta variable no está seteada y Playwright usa su
    // propia resolución de navegador (el que instala `npx playwright install`).
    ...(process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE']
      ? { launchOptions: { executablePath: process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE'] } }
      : {}),
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      // Breakpoint mobile del layout (sm: 640px, ver tailwind) — Pixel 7 (412px) cae bien debajo.
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `npm start -- --port ${PUERTO}`,
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
