import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';

test('abre el panel desde Reportes > Analista', async ({ page }) => {
  await inyectarSesionVigente(page);
  await page.route('**/cores2/ant/**', (route) =>
    route.fulfill({
      json: {
        code: '0',
        headers: {},
        body: {
          menu_response: [
            { cod_sec: 'REPORTES', desc_sec: 'Reportes', act_sec: '/app/reportes' },
            { cod_sec: 'ASESORES', cod_par: 'REPORTES', desc_sec: 'Analista' },
            {
              cod_sec: 'CARTERA',
              cod_par: 'ASESORES',
              desc_sec: 'Cartera',
              act_sec: '/app/reportes/leg/com/rda/sec/cartera',
            },
          ],
        },
      },
    }),
  );
  await page.goto('/app/reportes/analista'); // gobernanza: ruta-de-carpeta (carpeta del explorador)
  await page.getByRole('button', { name: 'Panel unificado del asesor', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/analista\/panel-unificado$/);
  await expect(page.locator('app-panel-unificado')).toBeVisible();
});

test('panel del asesor consulta Ant, sin datos ficticios, y no desborda en claro ni oscuro', async ({ page }) => {
  await inyectarSesionVigente(page);
  await mockearBackendAnt(page);
  await page.goto('/app/analista/panel-unificado');
  const panel = page.locator('app-panel-unificado');
  await expect(panel).toBeVisible();
  await expect(panel).not.toContainText('Datos ficticios');
  await expect(panel).not.toContainText('Microempresa');
  await expect(panel).not.toContainText('peticiones');
  for (const oscuro of [false, true]) {
    await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), oscuro);
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
});
