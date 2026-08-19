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

  test('"Monitor Metas Desembolso" cae al estado vacío si el backend no devuelve jerarquía', async ({ page }) => {
    await page.goto(RUTA_DESEMBOLSO);
    // En mobile, si Col 2 (panel de navegación) llegara a estar abierta, tapa el contenido.
    await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();

    await expect(page.getByRole('heading', { name: 'Monitor Metas Desembolso' })).toBeVisible();
    // El backend está mockeado con éxito vacío: sin raíz que emitir, el
    // selector no elige nada y la pantalla queda invitando a hacerlo. Con
    // jerarquía real se ve el consolidado al entrar — ver `reportes-jerarquia.spec.ts`.
    await expect(page.getByText('Elige un nivel de la jerarquía')).toBeVisible();
    await expect(page.getByText('Operaciones Desembolsadas')).toBeHidden();
  });

  test('"Monitor Reprogramados" muestra su título y, al abrir los filtros, el de "Tipo"', async ({ page }) => {
    await page.goto(RUTA_REPROGRAMADOS);
    await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();

    await expect(page.getByRole('heading', { name: 'Monitor Reprogramados' })).toBeVisible();

    // Los filtros arrancan plegados detrás del botón de la barra de ventana
    // (`mostrarFiltros`), así que "Tipo" recién aparece al desplegarlos.
    await expect(page.getByLabel('Tipo')).toBeHidden();
    await page.getByRole('button', { name: 'Mostrar filtros' }).click();

    await expect(page.getByLabel('Tipo')).toBeVisible();
  });
});
