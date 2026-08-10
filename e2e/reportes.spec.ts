import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';
import { ShellPage } from './pages/shell.page';

/**
 * Smoke test del módulo "reportes" (`/app/reportes`): confirma que el primer
 * nodo migrado, "Avance Comercial" (`/app/reportes/avance-comercial`),
 * renderiza sin errores de consola y muestra sus 2 pestañas ("Monitor Metas
 * Desembolso"/"Monitor Reprogramados"). Sin datos reales del backend
 * (mockeado con éxito vacío), el selector de jerarquía queda vacío — la
 * lógica de negocio ya está cubierta a nivel unitario.
 */
test.describe('Reportes — smoke de Avance Comercial', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('/app/reportes/avance-comercial renderiza sin errores de consola', async ({ page }) => {
    const erroresConsola: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });
    page.on('pageerror', (err) => erroresConsola.push(err.message));

    await page.goto('/app/reportes/avance-comercial');
    await page.waitForLoadState('networkidle');

    expect(erroresConsola).toEqual([]);
  });

  test('muestra el título y las 2 pestañas de reportes', async ({ page }) => {
    await page.goto('/app/reportes/avance-comercial');

    await expect(page.getByRole('heading', { name: 'Avance Comercial' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Monitor Metas Desembolso' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Monitor Reprogramados' })).toBeVisible();
  });

  test('la pestaña "Monitor Reprogramados" muestra el selector de nivel y el filtro "Tipo"', async ({ page }) => {
    await page.goto('/app/reportes/avance-comercial');
    // En mobile, Col 2 (panel de navegación) arranca abierta y tapa el resto de la pantalla — ver `ShellPage`.
    await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();
    await page.getByRole('tab', { name: 'Monitor Reprogramados' }).click();

    const panel = page.getByRole('tabpanel', { name: 'Monitor Reprogramados' });
    await expect(panel.getByRole('button', { name: 'Elegir nivel' })).toBeVisible();
    await expect(panel.getByText('Elige un nivel de la jerarquía para ver el reporte.')).toBeVisible();
  });
});
