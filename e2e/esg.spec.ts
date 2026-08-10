import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';
import { ShellPage } from './pages/shell.page';

/**
 * Smoke test del módulo "framework-esg" (Cuadro de Mando ESG, `/app/esg`):
 * confirma que la pantalla renderiza sin errores de consola, que las 5
 * pestañas (Portada + 4 categorías) están presentes y que el toolbar/columna
 * "Acciones" de `CategoriaMetricasTablaComponent` tienen la forma esperada.
 * Sin datos reales del backend (mockeado con éxito vacío), así que las
 * tablas quedan vacías — el resaltado de filas is_nod y los botones por fila
 * ya están cubiertos a nivel unitario (`categoria-metricas-tabla.component.spec.ts`).
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

  test('no muestra los botones "Editar"/"Detalles" del toolbar — las acciones viven por fila', async ({ page }) => {
    await page.goto('/app/esg');

    await expect(page.getByRole('button', { name: 'Editar', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Detalles', exact: true })).toHaveCount(0);
  });

  test('la tabla de una categoría muestra la columna "Acciones" (sin la columna del lápiz)', async ({ page }) => {
    await page.goto('/app/esg');
    // En mobile, Col 2 (panel de navegación) arranca abierta y tapa el resto de la pantalla — ver `ShellPage`.
    await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();
    await page.getByRole('tab', { name: 'Medioambiente' }).click();

    await expect(page.getByRole('columnheader', { name: 'Acciones' })).toBeVisible();
  });
});
