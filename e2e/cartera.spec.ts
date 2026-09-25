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

test.describe('Tablas: 12 filas visibles y paginador dentro de la tabla', () => {
  /** Página de 30 filas de un reporte paginado en servidor (`additional.Total`), como `DET_INCEN_PDM`. */
  async function mockPaginado(page: Page) {
    const encabezados = [
      { columns: [{ columnDef: 'des', header: 'Descripción', isdata: 1 }, { columnDef: 'mon', header: 'Monto', isdata: 2, format: { type: 'number' } }] },
    ];
    const filas = Array.from({ length: 30 }, (_, i) => ({ des: `Fila ${i + 1}`, mon: (i + 1) * 1000 }));

    await page.route('**/cores2/ant/**', (route) => {
      const strands = route.request().headers()['winder-params'] ?? '';
      let body: unknown;
      if (strands.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
      else if (strands.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
      else body = { result: { headers: encabezados, body: filas, additional: { Total: 95 } } };
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
    });
  }

  test('"Desembolsos PDM" muestra 12 filas con scroll interno y el paginador en la tarjeta de la tabla', async ({ page }) => {
    // Ventana alta: acá manda el límite de 12 filas, no el tope por alto de ventana.
    await page.setViewportSize({ width: 1400, height: 1300 });
    await inyectarSesionVigente(page);
    await mockPaginado(page);
    await page.goto('/app/reportes/leg/com/rda/adm/det-ince-pdm');
    await page.waitForLoadState('networkidle');

    const tarjeta = page.locator('.mis-card').filter({ has: page.locator('app-tabla-reporte') });
    await expect(tarjeta.locator('tbody tr')).toHaveCount(30);
    const paginador = tarjeta.locator('p-paginator');
    await expect(paginador).toBeVisible();
    // En una sola línea: flechas y números uno al lado del otro, no apilados.
    const altoPaginador = await paginador.evaluate((el) => el.getBoundingClientRect().height);
    expect(altoPaginador).toBeLessThan(70);

    const contenedor = tarjeta.locator('.p-datatable-table-container');
    await expect
      .poll(() => contenedor.evaluate((el) => el.scrollHeight > el.clientHeight))
      .toBe(true);

    // La fila 12 entra entera y la 13 queda debajo del borde: el resto se ve con el scroll.
    const { pie12, inicio13, bordeInferior } = await contenedor.evaluate((el) => {
      const filas = el.querySelectorAll('tbody tr');
      return {
        pie12: filas[11].getBoundingClientRect().bottom,
        inicio13: filas[12].getBoundingClientRect().top,
        bordeInferior: el.getBoundingClientRect().bottom,
      };
    });
    expect(pie12).toBeLessThanOrEqual(bordeInferior + 1);
    expect(inicio13).toBeGreaterThanOrEqual(bordeInferior - 1);
    // Y el panel de la ventana no hace scroll: la tabla lo resuelve por dentro.
    const panel = page.locator('app-window-panel').first();
    await expect
      .poll(() => panel.evaluate((el) => [...el.querySelectorAll<HTMLElement>('*')].some((n) => getComputedStyle(n).overflowY.match(/auto|scroll/) && !n.classList.contains('p-datatable-table-container') && n.scrollHeight > n.clientHeight + 1)))
      .toBe(false);
  });

  test('en una ventana baja la tabla no pasa del 55 % del alto y el panel no scrollea', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 700 });
    await inyectarSesionVigente(page);
    await mockPaginado(page);
    await page.goto('/app/reportes/leg/com/rda/adm/det-ince-pdm');
    await page.waitForLoadState('networkidle');

    const contenedor = page
      .locator('.mis-card')
      .filter({ has: page.locator('app-tabla-reporte') })
      .locator('.p-datatable-table-container');
    await expect(contenedor.locator('tbody tr')).toHaveCount(30);
    await expect.poll(() => contenedor.evaluate((el) => el.clientHeight)).toBeLessThanOrEqual(Math.round(700 * 0.55) + 1);
  });
});

test.describe('Carga independiente: spinner hasta la primera tabla, esqueleto en las que faltan', () => {
  test('"Saldo Cartera": el spinner se corta con el primer bloque y los demás muestran esqueleto', async ({ page }) => {
    const encabezados = [{ columns: [{ columnDef: 'des', header: 'Descripción', isdata: 1 }] }];
    let bloques = 0;
    await page.route('**/cores2/ant/**', async (route) => {
      const strands = route.request().headers()['winder-params'] ?? '';
      let body: unknown;
      let espera = 0;
      if (strands.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
      else if (strands.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
      else if (strands.includes('regularData')) {
        // El primer bloque que se pide responde rápido; el resto tarda.
        espera = bloques++ === 0 ? 1500 : 6000;
        body = { result: { headers: encabezados, body: [{ des: 'Fila' }], additional: {} } };
      } else body = {};
      if (espera) await new Promise((r) => setTimeout(r, espera));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) }).catch(() => undefined);
    });
    await inyectarSesionVigente(page);
    await page.goto('/app/reportes/leg/com/rda/adm/saldo');

    const spinner = page.locator('app-loading-overlay [role="status"]');
    await expect(spinner).toBeVisible();

    // Llega el primer bloque: se va el spinner y las tablas que faltan muestran su esqueleto.
    await expect(spinner).toBeHidden({ timeout: 5000 });
    await expect(page.locator('app-tabla-reporte tbody tr:not(.fila-esqueleto)').first()).toBeVisible();
    await expect(page.locator('app-tabla-reporte tbody tr.fila-esqueleto').first()).toBeVisible();
  });
});
