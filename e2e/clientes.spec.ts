import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

const RAIZ = { tip_cod: 9, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 9, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];

/** Ruta del Host ↔ título de cada reporte de Clientes (Actividad Diaria). */
const REPORTES: readonly [string, string][] = [
  ['/app/reportes/leg/com/rda/adm/cli-nue-rec', 'Clientes Nuevos y Recurrentes'],
  ['/app/reportes/leg/com/rda/adm/cli-ope', 'Clientes y Operaciones'],
  ['/app/reportes/leg/com/rda/adm/cmg_cliente_flujo', 'Clientes Flujo'],
  ['/app/reportes/leg/com/rda/adm/cmg-cli', 'Stock de Clientes'],
  ['/app/reportes/repositorio/actividad-diaria/clientes/movimiento-clientes', 'Movimiento de Clientes'],
  ['/app/reportes/repositorio/actividad-diaria/mujer/mujer', 'Ranking Mujer'],
];

/** Jerarquía mínima + un `table.regular` con filas de varios `gru`. */
async function mockBackend(page: Page) {
  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};

    if (strands.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (strands.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (strands.includes('table.regular')) {
      body = {
        resultado: {
          headers: JSON.stringify([
            { key: 'desc', label: 'Descripción' },
            { key: 'total', label: 'Total', format: { type: 'integer' } },
          ]),
          data: [
            { gru: 1, desc: 'Activo', total: 100 },
            { gru: 2, desc: 'Pasivo', total: 200 },
            { gru: 7, desc: 'Producto', total: 300 },
            { gru: 6, desc: 'Mujeres', total: 400 },
          ],
        },
      };
    } else body = { result: { headers: [], body: [], additional: {} } };

    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });
}

test.describe('Clientes — smoke de las 6 pantallas migradas', () => {
  for (const [ruta, titulo] of REPORTES) {
    test(`${titulo} resuelve en ${ruta}`, async ({ page }) => {
      await inyectarSesionVigente(page);
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: titulo, exact: true })).toBeVisible();
      // Sin esto un typo en el `path` cae en el `**` del módulo y redirige al
      // primer reporte, con lo que el título de arriba igual podría aparecer.
      expect(page.url()).toContain(ruta);
    });
  }

  test('"Ranking Mujer" parte sus dos tablas en las pestañas del legado', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockBackend(page);
    await page.goto('/app/reportes/repositorio/actividad-diaria/mujer/mujer');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: 'Ranking Clientes Nuevo Mujeres' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Ranking Clientes Mujeres Total Cartera' })).toBeVisible();
  });

  test('"Movimiento de Clientes" carga sin jerarquía y reparte las filas por `gru`', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockBackend(page);
    await page.goto('/app/reportes/repositorio/actividad-diaria/clientes/movimiento-clientes');
    await page.waitForLoadState('networkidle');

    // El legado tiene el selector comentado: este reporte no lo tiene.
    await expect(page.locator('app-hier-selector')).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Carteras' })).toBeVisible();

    // Dentro de "Carteras" cada `gru` es su propia tabla, con su título.
    await expect(page.getByRole('heading', { name: 'Clientes Activo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Clientes Rurales Activo' })).toBeVisible();
    await expect(page.getByText('Activo', { exact: true }).first()).toBeVisible();

    // La tabla del `gru` 1 no debe traerse las filas del `gru` 2.
    const carteras = page.locator('app-tabla-dinamica').first();
    await expect(carteras.getByText('Pasivo', { exact: true })).toHaveCount(0);
  });
});
