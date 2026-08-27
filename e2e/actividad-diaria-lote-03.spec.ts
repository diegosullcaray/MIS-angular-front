import { test, expect } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

/**
 * Smoke del lote 03: "Aplicativo Móvil", "Tablero Digital" (con sus sub-nodos
 * Operaciones y Corresponsal) y los dos "Resumen de Movilidad", que no cuelgan
 * de ningún sub-nodo y viven como items directos de "Actividad Diaria".
 *
 * El título esperado es el `data.title` de `rda-administracion-routing.module.ts`,
 * que es lo que el legado pinta en la barra de la ventana.
 */
const REPORTES: readonly [string, string][] = [
  // Aplicativo Móvil
  ['/app/reportes/leg/com/rda/adm/app_uso', 'Uso del App'],
  // Tablero Digital
  ['/app/reportes/leg/com/rda/adm/tab-digital', 'Tablero Digital - Corresponsales'],
  ['/app/reportes/repositorio/actividad-diaria/tab-digital/usa-come', 'Tablero Digital Comercial'],
  // Tablero Digital → Operaciones
  ['/app/reportes/leg/com/rda/adm/GC-tab-digital_vr2-ope', 'Gestión Canal Tablero Digital'],
  ['/app/reportes/leg/com/rda/adm/tab-digital_vr2-ope', 'Tablero Digital'],
  // Tablero Digital → Corresponsal
  ['/app/reportes/leg/com/rda/adm/v-general-cor', 'Vista General - Corresponsales'],
  ['/app/reportes/leg/com/rda/adm/v-gestion-cor', 'Vista Gestión - Corresponsales'],
  ['/app/reportes/leg/com/rda/adm/det_correspon', 'Detalle Corresponsal'],
  // Resumen de Movilidad (items directos)
  ['/app/reportes/leg/com/rda/adm/res-mov', 'Resumen de Movilidad Comercial'],
  ['/app/reportes/leg/com/rda/adm/res-mov-rec', 'Resumen de Movilidad Recuperaciones'],
];

test.describe('Actividad Diaria — smoke del lote 03', () => {
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
