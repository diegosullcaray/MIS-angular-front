import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';

/**
 * Smoke test del módulo "framework-esg" (Cuadro de Mando ESG, `/app/esg`):
 * confirma que la pantalla renderiza sin errores de consola y que las 5
 * pestañas (Portada + 4 categorías) están presentes. Sin datos reales del
 * backend (mockeado con éxito vacío), así que las tablas quedan vacías — la
 * lógica de negocio ya está cubierta a nivel unitario.
 */
test.describe('ESG — smoke del Cuadro de Mando', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('/app/esg renderiza sin errores de consola', async ({ page }) => {
    const erroresConsola: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });
    page.on('pageerror', (err) => erroresConsola.push(err.message));

    await page.goto('/app/esg');
    await page.waitForLoadState('networkidle');

    expect(erroresConsola).toEqual([]);
  });

  test('muestra el título y las 5 pestañas (Portada + 4 categorías)', async ({ page }) => {
    await page.goto('/app/esg');

    await expect(page.getByText('Cuadro de Mando ESG')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Portada' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Medioambiente' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Social | Empleado' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Social | Cliente' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Gobierno' })).toBeVisible();
  });

  test('el botón "Detalles" empieza deshabilitado (sin fila seleccionada)', async ({ page }) => {
    await page.goto('/app/esg');

    await expect(page.getByRole('button', { name: 'Detalles' })).toBeDisabled();
  });
});
