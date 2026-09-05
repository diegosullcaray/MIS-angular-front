import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';
import { ShellPage } from './pages/shell.page';

/**
 * Caché de la jerarquía, medido en peticiones reales.
 *
 * El STG resuelve cada nivel una vez y después lo lee de `localStorage`
 * (`CacheService.isCache/loadCache`). La migración no cacheaba nada: cada
 * pantalla que monta el selector repetía `base_hier` + `level_hier` + el nivel
 * siguiente —**en serie**— antes de que arrancara la consulta del reporte. Al
 * ir y volver entre dos reportes se pagaban los tres viajes de nuevo, y eso es
 * lo que se sentía como "el legacy carga más rápido".
 *
 * Este spec cuenta las peticiones: es la prueba de que el caché sirve, y la
 * red que impide que alguien lo saque sin darse cuenta.
 */
const RAIZ = { tip_cod: 1, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 1, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];
const NIVEL_2 = [
  { tip_cod: 2, cod_rel: 'Z-NORTE', des_rel: 'ZONA NORTE', lvl: 2, lbl_hier: 'ZONA' },
  { tip_cod: 2, cod_rel: 'Z-SELVA', des_rel: 'ZONA SELVA', lvl: 2, lbl_hier: 'ZONA' },
];

/** Rutas de dos reportes distintos que montan el mismo selector de jerarquía. */
const REPORTE_A = '/app/reportes/leg/com/rda/adm/mon-desem';
const REPORTE_B = '/app/reportes/leg/com/rda/adm/mon-salidas';

interface Conteo {
  base: number;
  nivel: number;
}

async function mockJerarquia(page: Page): Promise<Conteo> {
  const conteo: Conteo = { base: 0, nivel: 0 };

  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};

    if (strands.includes('base_hier')) {
      conteo.base++;
      body = { base_hierarchy: [RAIZ] };
    } else if (strands.includes('level_hier')) {
      conteo.nivel++;
      if (strands.includes('"lvl_jer":1') || strands.includes('"lvl_jer": 1')) body = { level_hierarchy: NIVEL_1 };
      else if (strands.includes('"lvl_jer":2') || strands.includes('"lvl_jer": 2')) body = { level_hierarchy: NIVEL_2 };
      else body = { level_hierarchy: [] };
    } else {
      body = { result: { headers: [], body: [], additional: {} } };
    }

    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });

  return conteo;
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await page.waitForLoadState('networkidle');
  await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();
  await page.waitForTimeout(600);
}

test.describe('La jerarquía se pide una vez por sesión, no una vez por pantalla', () => {
  test('volver a la misma pantalla no vuelve a pedir la jerarquía', async ({ page }) => {
    await inyectarSesionVigente(page);
    const conteo = await mockJerarquia(page);

    await abrir(page, REPORTE_A);
    const primeraVisita = { ...conteo };

    // Que la primera visita pida algo es el punto de partida: si no pidiera
    // nada, el resto del test no probaría nada.
    expect(primeraVisita.base).toBeGreaterThan(0);
    expect(primeraVisita.nivel).toBeGreaterThan(0);

    // Ir a otro reporte y volver: en una SPA esto desmonta y remonta el selector.
    await abrir(page, REPORTE_B);
    await abrir(page, REPORTE_A);

    expect(conteo.base, 'la raíz se pidió de nuevo al volver').toBe(primeraVisita.base);
    expect(conteo.nivel, 'los niveles se pidieron de nuevo al volver').toBe(primeraVisita.nivel);
  });

  test('dos reportes con la misma jerarquía comparten lo ya resuelto', async ({ page }) => {
    await inyectarSesionVigente(page);
    const conteo = await mockJerarquia(page);

    await abrir(page, REPORTE_A);
    const trasElPrimero = { ...conteo };

    await abrir(page, REPORTE_B);

    expect(conteo.base).toBe(trasElPrimero.base);
    expect(conteo.nivel).toBe(trasElPrimero.nivel);
  });

  /**
   * El caché sobrevive al F5, igual que el del STG: es el caso que más se
   * repite en uso real —el usuario recarga cuando algo se ve raro— y el que
   * más caro salía.
   */
  test('recargar la página tampoco vuelve a pedirla', async ({ page }) => {
    await inyectarSesionVigente(page);
    const conteo = await mockJerarquia(page);

    await abrir(page, REPORTE_A);
    const antes = { ...conteo };

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    expect(conteo.base).toBe(antes.base);
    expect(conteo.nivel).toBe(antes.nivel);
  });

  /**
   * Y muere con la pestaña. Es la diferencia deliberada con el STG, que cachea
   * en `localStorage` con una clave sin fecha de corte y por eso puede servir
   * el árbol de ayer.
   */
  test('una pestaña nueva arranca preguntando de cero', async ({ page, context }) => {
    await inyectarSesionVigente(page);
    const conteo = await mockJerarquia(page);
    await abrir(page, REPORTE_A);
    const antes = conteo.base;

    const otra = await context.newPage();
    await inyectarSesionVigente(otra);
    await otra.route('**/cores2/ant/**', (route) => {
      const strands = route.request().headers()['winder-params'] ?? '';
      if (strands.includes('base_hier')) conteo.base++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: '0', headers: {}, body: { base_hierarchy: [RAIZ] } }),
      });
    });
    await otra.goto(REPORTE_A);
    await otra.waitForLoadState('networkidle');

    expect(conteo.base).toBeGreaterThan(antes);
    await otra.close();
  });
});
