import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

const RAIZ = { tip_cod: 1, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 1, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];

/** Jerarquía mínima: con la raíz resuelta el reporte ya sale del estado vacío. */
async function mockJerarquia(page: Page) {
  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};

    if (strands.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (strands.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (strands.includes('regularData')) body = { result: { headers: [], body: [], additional: {} } };

    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });
}

/** Ruta del Host ↔ título de cada reporte de Captaciones (Actividad Diaria). */
const REPORTES: readonly [string, string][] = [
  ['/app/reportes/leg/com/rda/adm/cmg-capta01', 'CMG Captaciones - Agencias'],
  ['/app/reportes/leg/com/rda/adm/cap-age', 'Captaciones por Canal'],
  ['/app/reportes/leg/com/rda/adm/tasa-pas', 'Gestión de Tasas Pasivas'],
  ['/app/reportes/leg/com/rda/adm/panel-operaciones', 'Panel Operaciones'],
  ['/app/reportes/repositorio/actividad-diaria/caracterizacion/pasivo', 'Gestión Pasivo Comercial'],
  ['/app/reportes/repositorio/actividad-diaria/caracterizacion/pasivocom', 'Vinculación Cartera'],
];

test.describe('Captaciones — smoke de las 6 pantallas migradas', () => {
  for (const [ruta, titulo] of REPORTES) {
    test(`${titulo} resuelve en ${ruta}`, async ({ page }) => {
      await inyectarSesionVigente(page);
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: titulo })).toBeVisible();
      // Sin esto un typo en el `path` cae en el `**` del módulo y redirige al
      // primer reporte, con lo que el título de arriba igual podría aparecer.
      expect(page.url()).toContain(ruta);
    });
  }

  test('Panel Operaciones parte sus dos bloques en los tabs del legado', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockJerarquia(page);
    await page.goto('/app/reportes/leg/com/rda/adm/panel-operaciones');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: 'Panel Operación Reva' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Panel Operación Regulatorio' })).toBeVisible();
  });

  test('el filtro propio del reporte va debajo del selector de jerarquía', async ({ page }) => {
    await inyectarSesionVigente(page);
    await page.goto('/app/reportes/leg/com/rda/adm/panel-operaciones');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Mostrar filtros' }).click();

    const filtros = page.locator('[ventana-filtros]');
    await expect(filtros).toHaveClass(/flex-col/);

    const orden = await filtros.evaluate((el) => [...el.children].map((c) => c.tagName.toLowerCase()));
    expect(orden[0]).toBe('app-hier-selector');
    expect(orden[1]).toBe('app-select-filtro');
  });
});
