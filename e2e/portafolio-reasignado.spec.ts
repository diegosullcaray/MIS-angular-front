import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

const RAIZ = { tip_cod: 9, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 9, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];

/** Ruta del Host ↔ título de cada reporte de Portafolio Reasignado. */
const REPORTES: readonly [string, string][] = [
  ['/app/reportes/repositorio/actividad-diaria/reasignado/reasignado', 'Efectividad por tramos'],
  ['/app/reportes/leg/com/rda/adm/gest_cart_her', 'Gestión de Cartera Reasignada'],
  ['/app/reportes/leg/com/rda/adm/mon-efec-reasig', 'Monitor Efectividades Reasignados'],
];

/** Cuerpos pedidos al backend, para comprobar qué se consulta y con qué parámetros. */
let pedidos: { strands: string; params: string }[] = [];

async function mockBackend(page: Page) {
  pedidos = [];
  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    pedidos.push({ strands, params: strands });

    let body: unknown = {};
    if (strands.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (strands.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (strands.includes('table.regular')) body = { resultado: { headers: '[]', data: [] } };
    else body = { result: { headers: [], body: [], additional: { Total: 42 } } };

    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });
}

test.describe('Portafolio Reasignado — smoke de las 3 pantallas migradas', () => {
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

  test('"Gestión de Cartera Reasignada" arma las pestañas Resumen y Detalle del host `cra-v11`', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockBackend(page);
    await page.goto('/app/reportes/leg/com/rda/adm/gest_cart_her');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: 'Resumen' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Detalle' })).toBeVisible();
  });

  test('"Monitor Efectividades" ofrece los seis filtros propios del detalle', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockBackend(page);
    await page.goto('/app/reportes/leg/com/rda/adm/mon-efec-reasig');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Detalle de Efectividades' }).click();

    for (const filtro of ['Tramo', 'Producto', 'Compromiso roto', '0 Cuota', '1 Cuota', 'Tramo días gestión']) {
      await expect(page.getByLabel(filtro, { exact: true })).toBeVisible();
    }
  });

  test('el asesor solo se consulta al pulsar el botón, no mientras se escribe', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockBackend(page);
    await page.goto('/app/reportes/leg/com/rda/adm/mon-efec-reasig');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: 'Detalle de Efectividades' }).click();

    await page.getByPlaceholder('Nombre del asesor').fill('perez');
    await page.waitForTimeout(400);
    expect(pedidos.some((p) => p.params.includes('%perez%'))).toBe(false);

    await page.getByRole('button', { name: 'Buscar asesor' }).click();
    await page.waitForTimeout(600);
    expect(pedidos.some((p) => p.params.includes('%perez%'))).toBe(true);
  });
});
