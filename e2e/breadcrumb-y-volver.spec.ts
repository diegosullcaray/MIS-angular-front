import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';
import { ShellPage } from './pages/shell.page';

/**
 * Dos piezas de navegación que se rompían en móvil:
 *
 * - En móvil el breadcrumb se oculta para que el header no compita con las
 *   acciones globales. La ruta completa se conserva en escritorio.
 * - Los paneles tipo ventana no tenían forma de volver salvo el semáforo, que
 *   lleva al inicio y no al paso anterior.
 */
/** Ruta anidada del Host: Actividades › Prospectos Corresponsal. */
const RUTA_PROFUNDA = '/app/actividades/reg-prosp-corr';

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

  test('se oculta para dejar el header disponible a las acciones globales', async ({ page }) => {
    await abrir(page, RUTA_PROFUNDA);

    await expect(page.locator('.header-breadcrumb')).toBeHidden();
  });

  test('el header no desborda con la ruta más profunda', async ({ page }) => {
    await abrir(page, RUTA_PROFUNDA);

    const desborda = await page.evaluate(() => {
      const d = document.documentElement;
      return d.scrollWidth > d.clientWidth;
    });
    expect(desborda).toBe(false);
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
    expect(etiquetas).toContain('Actividades');
    expect(etiquetas).toContain('Prospectos Corresponsal');
  });
});

test.describe('Flecha de volver del panel de ventana', () => {
  /**
   * Regresión de INC-2026-09-08-06. Antes esta prueba esperaba terminar en
   * `/app/dashboard`, que era justo el defecto: el explorador del sistema no es
   * una ruta —se pinta sobre el `<router-outlet>` desde el estado del shell—,
   * así que retroceder en el historial se lo saltaba entero y sacaba al usuario
   * del sistema. Ahora sube UN nivel: al explorador, y **sin cambiar la URL**,
   * para que el contenido vuelva intacto.
   */
  test('está presente y sube al explorador del sistema, no al inicio', async ({ page }) => {
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

    await expect(page.locator('.mis-explorador')).toBeVisible();
    expect(page.url()).toContain(RUTA_PROFUNDA);
  });
});
