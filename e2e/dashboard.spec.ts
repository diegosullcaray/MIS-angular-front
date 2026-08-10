import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';

/**
 * Smoke test del módulo "dashboard" (Dashboards Integrados, `/app/dashboards`):
 * confirma que la lista renderiza sin errores de consola y que la ruta del
 * visor de Power BI (`/app/dashboards/power-bi`) redirige de vuelta a la
 * lista cuando se entra directo, sin un reporte elegido antes (ver
 * `PowerBiComponent`, constructor). Sin datos reales del backend (mockeado
 * con éxito vacío), la lista queda vacía — la lógica de negocio ya está
 * cubierta a nivel unitario.
 */
test.describe('Dashboard — smoke de Dashboards Integrados', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('/app/dashboards renderiza sin errores de consola', async ({ page }) => {
    const erroresConsola: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });
    page.on('pageerror', (err) => erroresConsola.push(err.message));

    await page.goto('/app/dashboards');
    await page.waitForLoadState('networkidle');

    expect(erroresConsola).toEqual([]);
  });

  test('muestra el título, el botón Actualizar y los filtros por tipo', async ({ page }) => {
    await page.goto('/app/dashboards');

    await expect(page.getByText('Dashboards Integrados')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Actualizar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Power BI' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Oracle AC' })).toBeVisible();
  });

  test('entrar directo a /app/dashboards/power-bi sin reporte elegido redirige a la lista', async ({ page }) => {
    await page.goto('/app/dashboards/power-bi');
    await page.waitForURL('**/app/dashboards');

    await expect(page.getByText('Dashboards Integrados')).toBeVisible();
  });
});
