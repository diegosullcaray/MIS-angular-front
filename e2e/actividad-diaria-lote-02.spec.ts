import { test, expect } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

/**
 * Smoke de los cinco módulos migrados en el lote 02: Seguros, Campañas,
 * Comercial Ejecutivo, Proyecciones y Reportes PDM.
 */
const REPORTES: readonly [string, string][] = [
  // Seguros
  ['/app/reportes/leg/com/rda/adm/cam-seguros', 'Reporte Seguros'],
  ['/app/reportes/repositorio/actividad-diaria/seguros-pasivos/seguros-pasivos', 'Seguros Pasivos'],
  ['/app/reportes/repositorio/actividad-diaria/seguro/seguro-com', 'Reporte Seguros Optativos'],
  // Campañas
  ['/app/reportes/leg/com/rda/adm/cam-apa', 'Apadrinamiento'],
  ['/app/reportes/leg/com/rda/adm/RMentoring', 'Reporte Mentoring'],
  ['/app/reportes/repositorio/actividad-diaria/campanias/agendamiento', 'Agendamiento'],
  // Comercial Ejecutivo
  ['/app/reportes/leg/com/rda/adm/desem-reacfae', 'Desembolsos'],
  ['/app/reportes/leg/com/rda/adm/cli', 'Clientes'],
  ['/app/reportes/leg/com/rda/adm/agro', 'Agro'],
  ['/app/reportes/leg/com/rda/adm/pdm', 'PDM'],
  // Proyecciones
  ['/app/reportes/leg/com/rda/adm/proy_M1', 'Proyección colocación'],
  ['/app/reportes/leg/com/rda/adm/proy_M2', 'Proyección diaria colocación'],
  // Reportes PDM
  ['/app/reportes/leg/com/rda/adm/seg_pdm', 'Seguimiento PDM'],
  ['/app/reportes/repositorio/actividad-diaria/cartera/banca-solidaria', 'Gestión de Banca Solidaria'],
  // Los dos "Resumen de Movilidad" dejaron de ser un módulo propio: ahora son
  // items directos de "Actividad Diaria" y su smoke vive en el lote 03.
];

test.describe('Actividad Diaria — smoke del lote 02', () => {
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
});

/**
 * "Proyección colocación" · Detalle: el legado (`cra-v11`, `rendererSync()`) pide `PROYEC_COLREC_03`
 * paginado, con `pagen` y el nodo completo, sin `fec`. Sin eso el backend respondía 500
 * ("Resultado vacio para: regularData").
 */
test('"Proyección colocación" pide el Detalle paginado y muestra su tabla con paginador', async ({ page }) => {
  const RAIZ = { tip_cod: 9, cod_rel: 'FC', lvl: 1 };
  const NIVEL_1 = [{ tip_cod: 9, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];
  const pedidosDetalle: Record<string, unknown>[] = [];

  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};
    if (strands.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (strands.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (strands.includes('PROYEC_COLREC_03')) {
      const [{ payload }] = JSON.parse(strands) as { payload: Record<string, unknown> }[];
      pedidosDetalle.push(payload);
      // Como el backend: sin `pagen` no hay resultado.
      if (!('pagen' in payload)) {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Resultado vacio para: regularData"}' });
      }
      body = {
        result: {
          headers: [{ columns: [{ columnDef: 'ase', header: 'Asesor', isdata: 1 }] }],
          body: Array.from({ length: 30 }, (_, i) => ({ ase: `Asesor ${i + 1}` })),
          additional: { Total: 95 },
        },
      };
    } else if (strands.includes('regularData')) body = { result: { headers: [], body: [], additional: {} } };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });

  await inyectarSesionVigente(page);
  await page.goto('/app/reportes/leg/com/rda/adm/proy_M1');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: 'Detalle' }).click();

  await expect(page.getByRole('cell', { name: 'Asesor 1', exact: true })).toBeVisible();
  const tarjeta = page.locator('.mis-card').filter({ has: page.getByRole('cell', { name: 'Asesor 1', exact: true }) });
  await expect(tarjeta.locator('p-paginator')).toBeVisible();
  expect(pedidosDetalle[0]).toMatchObject({ pagen: 1, tip_cod: 9, cod_rel: 'FC' });
  expect(pedidosDetalle[0]).not.toHaveProperty('fec');
});

