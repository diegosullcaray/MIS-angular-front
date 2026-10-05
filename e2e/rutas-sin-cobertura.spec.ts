import { test, expect } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

/** Smoke de las rutas que ningún otro spec tocaba: Desarrollo Sostenible, Control de Cargas, Actividades y Actividad Comercial. */
const RUTAS: readonly string[] = [
  '/app/reportes/leg/com/rda/adm/mon-desem-misi',
  '/app/reportes/leg/com/rda/adm/desemp-social',
  '/app/reportes/repositorio/actividad-diaria/prod-misionales/productos-misionales',
  '/app/reportes/leg/prd',
  '/app/actividades/regprosp-corr',
  '/app/act_comercial',
];

test.describe('Rutas sin cobertura previa — smoke', () => {
  for (const ruta of RUTAS) {
    test(`resuelve ${ruta}`, async ({ page }) => {
      await inyectarSesionVigente(page);
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');

      // Un typo en el `path` cae en el `**` (otra pantalla) o en `/error/*`.
      expect(page.url()).toContain(ruta);
      await expect(page.getByRole('heading').first()).toBeVisible();
    });
  }
});
