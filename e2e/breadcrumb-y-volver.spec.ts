import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';
import { ShellPage } from './pages/shell.page';

/**
 * Dos piezas de navegación que se rompían en móvil:
 *
 * - El breadcrumb pintaba el camino entero. A partir del tercer nivel las
 *   etiquetas se comprimían hasta volverse ilegibles y el header desbordaba.
 *   Ahora en pantalla angosta queda `… › Página`, con los puntos apuntando al
 *   nivel de arriba.
 * - Los paneles tipo ventana no tenían forma de volver salvo el semáforo, que
 *   lleva al inicio y no al paso anterior.
 */
/** Cuatro niveles: Presupuesto › Líneas › Activos › Cartera de Créditos. */
const RUTA_PROFUNDA = '/app/presupuesto/lineas/activos/car-cre';

async function abrir(page: import('@playwright/test').Page, ruta: string) {
  await inyectarSesionVigente(page);
  await mockearBackendAnt(page);
  await page.goto(ruta);
  await page.waitForLoadState('networkidle');
  await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();
  await page.waitForTimeout(400);
}

test.describe('Breadcrumb en pantalla angosta', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('a partir del tercer nivel se pliega a «… › Página»', async ({ page }) => {
    await abrir(page, RUTA_PROFUNDA);

    const textos = await page.locator('.header-breadcrumb .p-breadcrumb-list > li').allTextContents();
    const etiquetas = textos.map((t) => t.trim()).filter(Boolean);

    // Queda el home (ícono, sin texto), los puntos y la página actual.
    expect(etiquetas).toContain('…');
    expect(etiquetas).toContain('Cartera de Créditos');
    expect(etiquetas).not.toContain('Líneas');
  });

  test('el header no desborda con la ruta más profunda', async ({ page }) => {
    await abrir(page, RUTA_PROFUNDA);

    const desborda = await page.evaluate(() => {
      const d = document.documentElement;
      return d.scrollWidth > d.clientWidth;
    });
    expect(desborda).toBe(false);
  });

  test('los puntos suben un nivel, no llevan al inicio', async ({ page }) => {
    await abrir(page, RUTA_PROFUNDA);

    const puntos = page.locator('.header-breadcrumb a', { hasText: '…' });
    await expect(puntos).toHaveCount(1);

    await puntos.click();
    await page.waitForTimeout(400);

    // Sube un nivel: sigue dentro del árbol, no en el dashboard.
    expect(page.url()).not.toContain('/app/dashboard');
    expect(page.url()).toContain('/app/presupuesto/lineas/activos');
  });
});

test.describe('Breadcrumb en escritorio', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('mantiene el camino completo: ahí sí entra', async ({ page }) => {
    await abrir(page, RUTA_PROFUNDA);

    const etiquetas = (await page.locator('.header-breadcrumb .p-breadcrumb-list > li').allTextContents())
      .map((t) => t.trim())
      .filter(Boolean);

    expect(etiquetas).not.toContain('…');
    expect(etiquetas).toContain('Líneas');
    expect(etiquetas).toContain('Cartera de Créditos');
  });
});

test.describe('Flecha de volver del panel de ventana', () => {
  test('está presente y regresa al paso anterior', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);

    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
    await page.goto(RUTA_PROFUNDA);
    await page.waitForLoadState('networkidle');
    await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();
    await page.waitForTimeout(400);

    const volver = page.getByRole('button', { name: 'Volver', exact: true }).first();
    await expect(volver).toBeVisible();

    await volver.click();
    await page.waitForTimeout(600);

    expect(page.url()).toContain('/app/dashboard');
  });
});
