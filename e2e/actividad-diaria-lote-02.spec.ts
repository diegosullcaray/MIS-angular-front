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
  ['/app/reportes/repositorio/actividad-diaria/seg-pasivos-graf/seguro-pasivos-grafico', 'Evolutivo Pasivos'],
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
