import { test, expect } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

const RAIZ = { tip_cod: 9, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 9, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];

/** 14 columnas: la descripción y 13 montos de siete dígitos, con el ancho fijo que manda el backend. */
const COLUMNAS = Array.from({ length: 14 }, (_, i) => ({
  columnDef: `c${i}`,
  header: i === 0 ? 'Descripción' : `Indicador largo ${i} Mes Actual`,
  isdata: i + 1,
  format: i === 0 ? { type: 'string' } : { type: 'number', mode: '.0-0' },
  style: { desktop: { width: '140px' } },
}));
const FILAS = Array.from({ length: 10 }, (_, r) =>
  Object.fromEntries(COLUMNAS.map((c, i) => [c.columnDef, i === 0 ? `Agencia número ${r}` : -1083623 + r * 1000])),
);

/**
 * "Clientes" y "Proyección colocación" usan `[ajustarAncho]` (modo compacto de `app-tabla-reporte`):
 * en una pantalla de escritorio estándar la tabla entra sin scroll horizontal.
 */
for (const ruta of ['/app/reportes/leg/com/rda/adm/cli', '/app/reportes/leg/com/rda/adm/proy_M1']) {
  test(`${ruta}: la tabla entra en 1366 px sin scroll horizontal`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 });
    await page.route('**/cores2/ant/**', (route) => {
      const strands = route.request().headers()['winder-params'] ?? '';
      const body = strands.includes('base_hier')
        ? { base_hierarchy: [RAIZ] }
        : strands.includes('level_hier')
          ? { level_hierarchy: NIVEL_1 }
          : { result: { headers: [{ columns: COLUMNAS }], body: FILAS, additional: {} } };
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
    });
    await inyectarSesionVigente(page);
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');

    const contenedor = page
      .locator('.mis-card')
      .filter({ has: page.locator('app-tabla-reporte tbody tr td') })
      .first()
      .locator('.p-datatable-table-container');
    await expect(contenedor.locator('tbody tr').first()).toBeVisible();
    await expect.poll(() => contenedor.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  });
}
