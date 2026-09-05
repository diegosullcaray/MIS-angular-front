import { test, expect } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

/** Ruta del Host ↔ título de cada reporte de Cartera en Mora (Actividad Diaria). */
const REPORTES: readonly [string, string][] = [
  ['/app/reportes/leg/com/rda/adm/cmg-mora', 'CMG Cartera en Mora'],
  ['/app/reportes/leg/com/rda/adm/cmg-mora-simp', 'CMG Cartera en Mora Sin Impulso'],
  ['/app/reportes/leg/com/rda/adm/cal-cart', 'Calidad de Cartera'],
  ['/app/reportes/leg/com/rda/adm/port-sup', 'Portafolios y Supervisión'],
  ['/app/reportes/leg/com/rda/adm/zu-cuo', 'Cero y una Cuota'],
  ['/app/reportes/leg/com/rda/adm/mon-efec', 'Monitor Efectividades'],
  ['/app/reportes/leg/com/rda/adm/mon-efecrepro', 'Seguimiento Reprogramados'],
  ['/app/reportes/leg/com/rda/adm/mon-efec-sinasig', 'Efectividades Sin Asignar'],
  ['/app/reportes/leg/com/rda/adm/top-efec', 'Top Variables de Riesgos'],
  ['/app/reportes/leg/com/rda/adm/mon-efectramoscomer', 'Reporte de Pago Puntual'],
  ['/app/reportes/leg/com/rda/adm/ava-port', 'Seguimiento de Portafolio'],
  ['/app/reportes/repositorio/actividad-diaria/cartera/mon-imr', 'Monitor IMR'],
  ['/app/reportes/leg/com/rda/adm/graf-dashboard', 'Dashboard'],
  ['/app/reportes/repositorio/actividad-diaria/mora/cero-cuotas', 'Dashboard en Revisión'],
  ['/app/reportes/leg/com/rda/adm/cmd-cerocuotanueva', 'Cuadro de Mando'],
  ['/app/reportes/leg/com/rda/adm/Top-CeroCuota', 'Top'],
  ['/app/reportes/leg/com/rda/adm/list-cero-cuotas', 'Base de Gestión'],
];

test.describe('Cartera en Mora — smoke de las pantallas migradas', () => {
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
