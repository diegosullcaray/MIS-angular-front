import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';
import { ShellPage } from './pages/shell.page';

/**
 * El selector de jerarquía de reportes debe bajar de a un nivel: arranca en la
 * raíz ("Financiera") sin pedir ningún reporte, y recién consulta cuando el
 * usuario elige. Antes autoseleccionaba el primer nodo de cada nivel y
 * cascadeaba hasta el fondo, así que al entrar mostraba el reporte de la
 * primera agencia (Tingo María) sin que nadie lo pidiera.
 *
 * Jerarquía falsa: Financiera (raíz) -> 2 zonas -> 2 agencias.
 */
const RAIZ = { tip_cod: 1, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 1, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];
const NIVEL_2 = [
  { tip_cod: 2, cod_rel: 'Z-NORTE', des_rel: 'ZONA NORTE', lvl: 2, lbl_hier: 'ZONA' },
  { tip_cod: 2, cod_rel: 'Z-SELVA', des_rel: 'ZONA SELVA', lvl: 2, lbl_hier: 'ZONA' },
];
const NIVEL_3 = [
  { tip_cod: 3, cod_rel: 'AG-TM', des_rel: 'TINGO MARIA', lvl: 3, lbl_hier: 'AGENCIA' },
  { tip_cod: 3, cod_rel: 'AG-HCO', des_rel: 'HUANUCO', lvl: 3, lbl_hier: 'AGENCIA' },
];

/** Rutas de reporte pedidas, en orden. */
let reportesPedidos: string[] = [];

async function mockJerarquia(page: Page) {
  reportesPedidos = [];
  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};

    if (strands.includes('base_hier')) {
      body = { base_hierarchy: [RAIZ] };
    } else if (strands.includes('level_hier')) {
      // El nivel pedido viene en el payload del strand.
      if (strands.includes('"lvl_jer":1') || strands.includes('"lvl_jer": 1')) body = { level_hierarchy: NIVEL_1 };
      else if (strands.includes('"lvl_jer":2') || strands.includes('"lvl_jer": 2')) body = { level_hierarchy: NIVEL_2 };
      else if (strands.includes('"lvl_jer":3') || strands.includes('"lvl_jer": 3')) body = { level_hierarchy: NIVEL_3 };
      else body = { level_hierarchy: [] };
    } else if (strands.includes('regularData')) {
      const m = /"cod_rel":"([^"]+)"/.exec(strands);
      reportesPedidos.push(m ? m[1] : '?');
      body = { result: { headers: [], body: [], additional: {} } };
    }

    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });
}

test('arranca en Financiera, sin pedir reporte, y baja de a un nivel', async ({ page }) => {
  await inyectarSesionVigente(page);
  await mockJerarquia(page);

  await page.goto('/app/reportes/leg/com/rda/adm/mon-desem');
  await page.waitForLoadState('networkidle');
  // En mobile, si Col 2 (panel de navegación) llegara a estar abierta, tapa el contenido.
  await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();
  await page.waitForTimeout(600);

  const combos = page.locator('p-select');

  // Al entrar: ningún reporte pedido.
  expect(reportesPedidos).toEqual([]);
  // Financiera fijada + el nivel siguiente disponible para elegir.
  await expect(combos).toHaveCount(2);
  await expect(page.getByText('Elige un nivel de la jerarquía')).toBeVisible();

  // El selector vive dentro del panel de filtros, que arranca plegado: hay que
  // desplegarlo para poder operar los combos.
  await page.getByRole('button', { name: 'Mostrar filtros' }).click();
  await expect(combos.nth(1)).toBeVisible();

  // Elegir "ZONA SELVA" en el segundo combo.
  await combos.nth(1).click();
  await page.getByRole('option', { name: 'ZONA SELVA' }).click();
  await page.waitForTimeout(600);


  // Se pidió el reporte de la zona elegida, y apareció el nivel de agencia sin elegir.
  expect(reportesPedidos).toContain('Z-SELVA');
  expect(reportesPedidos).not.toContain('AG-TM');
  await expect(combos).toHaveCount(3);
});
