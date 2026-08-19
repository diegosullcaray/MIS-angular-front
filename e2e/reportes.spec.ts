import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';
import { ShellPage } from './pages/shell.page';

/**
 * Smoke test del módulo "reportes" (`/app/reportes`): confirma que los 2 nodos
 * migrados de "Avance Comercial" renderizan sin errores de consola y muestran
 * su selector de jerarquía.
 *
 * Cada reporte es una ruta propia con el path del legado STG
 * (`leg/com/rda/adm/*`), no pestañas de una pantalla contenedora — ver
 * `reportes.routes.ts`. Sin datos reales del backend (mockeado con éxito
 * vacío) el selector queda vacío; la lógica de negocio está cubierta a nivel
 * unitario.
 */
test.describe('Reportes — smoke de Avance Comercial', () => {
  const RUTA_DESEMBOLSO = '/app/reportes/leg/com/rda/adm/mon-desem';
  const RUTA_REPROGRAMADOS = '/app/reportes/leg/com/rda/adm/mon-rep';

  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('/app/reportes/avance-comercial redirige al primer reporte', async ({ page }) => {
    const erroresConsola: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });
    page.on('pageerror', (err) => erroresConsola.push(err.message));

    await page.goto('/app/reportes/avance-comercial');
    await page.waitForURL(`**${RUTA_DESEMBOLSO}`);
    await page.waitForLoadState('networkidle');

    expect(erroresConsola).toEqual([]);
  });

  test('"Monitor Metas Desembolso" pide elegir un nivel antes de mostrar el reporte', async ({ page }) => {
    await page.goto(RUTA_DESEMBOLSO);
    // En mobile, si Col 2 (panel de navegación) llegara a estar abierta, tapa el contenido.
    await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();

    await expect(page.getByRole('heading', { name: 'Monitor Metas Desembolso' })).toBeVisible();
    // Sin nivel elegido no se pinta el reporte — ver `reportes-jerarquia.spec.ts`.
    await expect(page.getByText('Elige un nivel de la jerarquía')).toBeVisible();
    await expect(page.getByText('Operaciones Desembolsadas')).toBeHidden();
  });

  test('"Monitor Reprogramados" muestra su título y el filtro "Tipo" sin nivel elegido', async ({ page }) => {
    await page.goto(RUTA_REPROGRAMADOS);
    await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();

    await expect(page.getByRole('heading', { name: 'Monitor Reprogramados' })).toBeVisible();

    // El panel de filtros se colapsa por defecto una vez que hay reporte a la
    // vista, pero mientras no se eligió ningún nivel de la jerarquía —que
    // vive en ese mismo panel— es la ÚNICA forma de ver algo, así que queda
    // forzado visible sin que haga falta ningún clic.
    await expect(page.getByLabel('Tipo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mostrar filtros' })).toHaveCount(0);
  });
});
