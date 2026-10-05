import { test, expect } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

/** Smoke de las rutas que ningún otro spec tocaba: Analista, Desarrollo Sostenible, Control de Cargas y Actividades. */
const RUTAS: readonly string[] = [
  ...[
    'cli-prod', 'cli-nue-rec', 'capta', 'sec-prosp', 'seg', 'mon-desem', 'rec-prev', 'zu-cuo',
    'pdm', 'aut-tasa', 'proy_M6', 'res-mov-sec', 'desempeno-social-as', 'mon_efec_sec', 'plan-mov-sec', 'inv-stk',
  ].map((r) => `/app/reportes/leg/com/rda/sec/${r}`),
  '/app/reportes/leg/com/rda/adm/mon-desem-misi',
  '/app/reportes/leg/com/rda/adm/desemp-social',
  '/app/reportes/repositorio/actividad-diaria/prod-misionales/productos-misionales',
  '/app/reportes/leg/prd',
  '/app/actividades/regprosp-corr',
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
