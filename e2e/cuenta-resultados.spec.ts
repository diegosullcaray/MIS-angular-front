import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

const RUTA = '/app/reportes/repositorio/actividad-mensual/rentabilidad/cuenta-resultados';
const RAIZ = { tip_cod: 9, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 9, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];

/** `TAB_CUE_RES_01`: `headers` trae los periodos del reporte, no columnas. */
const HEADERS = JSON.stringify({ preliminar: 1, fechas: ['2026-06-01', '2026-05-01'] });
const FILAS = [
  { style: 2, cuenta_codigo: 'CR012', cuenta_nombre: 'INGRESOS FINANCIEROS', variacion_periodo_anterior: -120 },
  { style: 2, cuenta_codigo: 'CR018', cuenta_nombre: 'GASTOS FINANCIEROS', variacion_periodo_anterior: -80 },
  { style: 3, cuenta_codigo: 'CR090', cuenta_nombre: 'RESULTADO NETO', variacion_periodo_anterior: 40 },
];

type Respuesta = 'datos' | 'vacio' | 'falla';

/** Backend simulado; devuelve los `winder-params` de cada consulta al reporte para inspeccionarlos. */
async function mockBackend(page: Page, respuesta: Respuesta): Promise<string[]> {
  const consultas: string[] = [];
  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};

    if (strands.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (strands.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (strands.includes('TAB_CUE_RES_01')) {
      consultas.push(strands);
      if (respuesta === 'falla') return route.fulfill({ status: 500, body: 'error' });
      body = { resultado: { headers: HEADERS, data: respuesta === 'datos' ? FILAS : [] } };
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });
  return consultas;
}

async function abrir(page: Page, respuesta: Respuesta): Promise<string[]> {
  await inyectarSesionVigente(page);
  const consultas = await mockBackend(page, respuesta);
  await page.goto(RUTA);
  await page.waitForLoadState('networkidle');
  return consultas;
}

test.describe('Cuenta de Resultados', () => {
  test('primera consulta con NOW y tabla del periodo más reciente', async ({ page }) => {
    const consultas = await abrir(page, 'datos');

    expect(consultas[0]).toContain('NOW');
    await expect(page.getByRole('heading', { name: 'Cuenta de Resultados', exact: true })).toBeVisible();
    await expect(page.getByText('Período: Junio de 2026')).toBeVisible();
    await expect(page.getByLabel('Período')).toContainText('Junio de 2026');
    await expect(page.getByText('Preliminar', { exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Mensual' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Acumulado' })).toBeVisible();

    // Gasto que baja: flecha abajo en verde (polaridad invertida del legado).
    const gasto = page.locator('app-tabla-dinamica tr').filter({ hasText: 'GASTOS FINANCIEROS' });
    await expect(gasto).toContainText('▼');
    await expect(gasto.locator('span[style*="--mis-success"]')).toContainText('80');
    const ingreso = page.locator('app-tabla-dinamica tr').filter({ hasText: 'INGRESOS FINANCIEROS' });
    await expect(ingreso.locator('span[style*="--mis-danger"]')).toContainText('120');
  });

  test('sin filas muestra el vacío, no un error', async ({ page }) => {
    await abrir(page, 'vacio');

    await expect(page.getByText('No se encontraron resultados para los filtros seleccionados.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('un fallo del backend es error con reintento, no tabla vacía', async ({ page }) => {
    await abrir(page, 'falla');

    await expect(page.getByRole('alert').filter({ hasText: 'No se pudo cargar el reporte.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    await expect(page.getByText('No se encontraron resultados')).toHaveCount(0);
  });
});
