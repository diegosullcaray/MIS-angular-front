import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

const RAIZ = { tip_cod: 9, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 9, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];

/** Con la raíz resuelta el reporte sale del estado vacío y monta sus pestañas. */
async function mockJerarquia(page: Page) {
  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};

    if (strands.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (strands.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (strands.includes('table.regular')) body = { resultado: { headers: '[]', data: [] } };
    else body = { result: { headers: [], body: [], additional: {} } };

    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });
}

/** Ruta del Host ↔ título de cada reporte de Cartera (Actividad Diaria). */
const REPORTES: readonly [string, string][] = [
  ['/app/reportes/leg/com/rda/adm/saldo', 'Saldo Cartera'],
  ['/app/reportes/leg/com/rda/adm/dat-prod', 'Datos por Producto'],
  ['/app/reportes/leg/com/rda/adm/port-agro', 'Portafolio Agropecuario'],
  ['/app/reportes/leg/com/rda/adm/desem-dia', 'Desembolsos Diarios'],
  ['/app/reportes/leg/com/rda/adm/aut-tasa', 'Reporte de Autonomía de Tasas'],
  ['/app/reportes/leg/com/rda/adm/ranking-diar', 'Reporte de Autonomías por Tasas'],
  ['/app/reportes/leg/com/rda/adm/des-cred', 'Seguimiento de Destino de Crédito'],
  ['/app/reportes/leg/com/rda/adm/com-dia', 'Comité de Créditos'],
  ['/app/reportes/leg/com/rda/adm/act-pdm', 'Activas PDM'],
  ['/app/reportes/leg/com/rda/adm/mora-pdm', 'Mora PDM'],
  ['/app/reportes/leg/com/rda/adm/res-inc_pdm', 'Incentivos PDM'],
  ['/app/reportes/leg/com/rda/adm/det-ince-pdm', 'Desembolsos PDM'],
  ['/app/reportes/repositorio/actividad-diaria/cartera/cmg-cartera', 'CMG Cartera'],
  ['/app/reportes/repositorio/actividad-diaria/cartera/estructura-desembolsos', 'Estructura de Desembolsos'],
  ['/app/reportes/repositorio/actividad-diaria/cartera/rank-comercial', 'Ranking Unidades de Negocio - Desembolsos'],
  ['/app/reportes/repositorio/actividad-diaria/cartera/agro-mix', 'Gestión Comercial - Portafolio Agrícola'],
  ['/app/reportes/repositorio/actividad-diaria/mon-comercial/Monincome', 'Monitor de Inteligencia de Negocios'],
  ['/app/reportes/repositorio/actividad-diaria/cartera/gest-comercial', 'Gestión Comercial'],
  [
    '/app/reportes/repositorio/actividad-diaria/cartera/mon-retenciones',
    'Monitor de Salidas y Retenciones por Nivel de Riesgo',
  ],
];

test.describe('Cartera — smoke de las pantallas migradas', () => {
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

  test('"Desembolsos Diarios" reparte sus bloques en las dos pestañas del host `cra-v1p2`', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockJerarquia(page);
    await page.goto('/app/reportes/leg/com/rda/adm/desem-dia');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: 'Desembolsos diarios' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Contratación electrónica' })).toBeVisible();
  });

  test('"Autonomía de Tasas" arma las cuatro pestañas del host `cra-aut-tasa`', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockJerarquia(page);
    await page.goto('/app/reportes/leg/com/rda/adm/aut-tasa');
    await page.waitForLoadState('networkidle');

    for (const tab of ['Por Nivel', 'Por Rango', 'Por producto', 'Evolutivo']) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible();
    }
  });

  test('"Ranking Comercial" ofrece sus tres filtros propios bajo el selector', async ({ page }) => {
    await inyectarSesionVigente(page);
    await page.goto('/app/reportes/repositorio/actividad-diaria/cartera/rank-comercial');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Mostrar filtros' }).click();

    await expect(page.getByPlaceholder('Buscar unidad…')).toBeVisible();
    await expect(page.getByPlaceholder('Buscar corredor…')).toBeVisible();
    await expect(page.getByLabel('Territorio')).toBeVisible();
  });
});
