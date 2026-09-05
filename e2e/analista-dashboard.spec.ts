import { test, expect } from '@playwright/test';
import { SESSION_STORAGE_KEY } from './fixtures/session';

const DATA = {
  nom: 'ANALISTA DEMO', car: 'ASESOR', cod_bt: 'BT-001', f4: '2026-08-25',
  sal_cap: 1200000, mon_des: 300000, mor_1: 1.2, mor_30: 2.4,
  f1: 'AGO', f2: 'JUL', f3: 'JUN', sal_cap_ant: 1100000, sal_cap_mant: 1000000,
  da_t1: 50, da_t2: 30, da_t3: 20, da_t4: 10, da_t5: 5, da_t6: 2,
};

test.describe('Dashboard del analista', () => {
  test('dibuja sus tres gráficas con `shared/ui/graficos`', async ({ page }) => {
    // Usuario NO admin: el dashboard carga solo con `usarColaboradorPropio()`.
    await page.addInitScript(({ key }) => {
      window.sessionStorage.setItem(key, JSON.stringify({
        token: 'e2e-fake-token',
        usuario: { id: 'e2e', nombre: 'Analista E2E', email: 'a@confianza.pe', rol: 'asesor', subsistemas: [], codBt: 'BT-001' },
        expiraEn: Date.now() + 15 * 60 * 1000,
      }));
    }, { key: SESSION_STORAGE_KEY });
    await page.route('**/cores2/ant/**', (route) => {
      const strands = route.request().headers()['winder-params'] ?? '';
      let body: unknown = {};
      if (strands.includes('dashboard.resumen')) {
        body = { resultado: { prof: [], data: DATA, cli_cre: [], h_cods: [{ cod: 'sal', des: 'Saldo' }] } };
      } else if (strands.includes('dashboard.historico')) {
        body = { resultado: { meta: { s1: 'Real', s2: 'Meta', s3: 'Año ant.' }, his_1: [1, 2, 3], his_2: [2, 3, 4], his_3: [3, 4, 5] } };
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
    });

    await page.goto('/app/analista');
    await page.waitForLoadState('networkidle');

    // Las tres gráficas montan un SVG de Highcharts con datos.
    await expect(page.locator('app-grafico-mixto .highcharts-root')).toHaveCount(2);
    await expect(page.locator('app-grafico-pie .highcharts-root')).toHaveCount(1);
    // "Comparativo Día" (el primero en el DOM): una columna por corte.
    const comparativo = page.locator('app-grafico-mixto').nth(0);
    await expect(comparativo.locator('.highcharts-series-group .highcharts-series-0 .highcharts-point')).toHaveCount(3);
    await expect(comparativo.getByText('JUN')).toBeVisible();

    // "Evolutivo Mensual": las tres series del histórico, con su leyenda.
    const evolutivo = page.locator('app-grafico-mixto').nth(1);
    await expect(evolutivo.locator('.highcharts-legend-item')).toHaveCount(3);

    // "Cartera por Tramos de Mora": una porción por tramo.
    await expect(page.locator('app-grafico-pie .highcharts-series-group .highcharts-point')).toHaveCount(6);
  });
});
