import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';

/**
 * Smoke test del módulo "incentivos" (Cuadro de Mando de Incentivos,
 * `/app/incentivos3`): confirma que la pantalla renderiza sin errores de
 * consola. El usuario de prueba tiene rol `admin-sistema` (ver
 * `fixtures/session.ts`), que `ShellStateService.esAdmin()` resuelve como
 * admin — mismo camino que el legado STAFF (ver nota de gap de datos en
 * `IncentivosService`) — así que el selector de nivel se abre solo y de
 * forma obligatoria (`requiereSeleccionInicial`), sin fondo del Cuadro de
 * Mando todavía. Sin datos reales del backend (mockeado con éxito vacío),
 * la lógica de negocio ya está cubierta a nivel unitario.
 */
test.describe('Incentivos — smoke del Cuadro de Mando', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('/app/incentivos3 renderiza sin errores de consola', async ({ page }) => {
    const erroresConsola: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });
    page.on('pageerror', (err) => erroresConsola.push(err.message));

    await page.goto('/app/incentivos3');
    await page.waitForLoadState('networkidle');

    expect(erroresConsola).toEqual([]);
  });

  test('con un usuario admin, abre el selector de nivel automáticamente y exige elegir uno', async ({ page }) => {
    await page.goto('/app/incentivos3');

    const dialogo = page.getByRole('dialog', { name: 'Selecciona Nivel' });
    await expect(dialogo).toBeVisible();
    await expect(page.getByRole('button', { name: 'Asesores' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unidades' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Corredores' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Territorios' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'FC Individual' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'FC Grupal' })).toBeVisible();

    // Paridad con Incentivos3 (commit 7b36254): un STAFF todavía no tiene un
    // nivel desde el cual armar el Cuadro de Mando, así que el primer selector
    // no se descarta — ni con la luz roja, ni con Escape. Lo que resolvió
    // INC-2026-09-08-08 (quedarse SIN acceso a los niveles) se sigue cumpliendo:
    // los seis niveles están a la vista.
    await expect(dialogo.getByRole('button', { name: 'Cerrar y volver al inicio' })).toHaveCount(0);
    await expect(page.locator('.p-dialog-close-button')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(dialogo).toBeVisible();
  });

  test('elegir "Asesores" muestra el buscador de colaboradores y un botón "Seleccionar" deshabilitado hasta elegir una fila', async ({ page }) => {
    await page.goto('/app/incentivos3');
    await page.getByRole('button', { name: 'Asesores' }).click();

    // El buscador es ahora el de `app-data-table`, con su propio texto guía.
    await expect(page.getByPlaceholder('Buscar por asesor, unidad, corredor o territorio...')).toBeVisible();
    // `exact` porque la barra de la ventana tiene su propio "Seleccionar nivel".
    await expect(page.getByRole('button', { name: 'Seleccionar', exact: true })).toBeDisabled();
  });
});

test.describe('Incentivos — selector de nivel en teléfono', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  /**
   * En teléfono se ocultaban Corredor y Territorio (`mobileVisible: false`), y
   * sin ellas no se distingue a dos asesores de igual nombre. Ahora se ven las
   * cuatro columnas de escritorio y la tabla se desplaza dentro del diálogo.
   */
  test('la lista de asesores muestra las mismas cuatro columnas que en escritorio, sin desbordar la pantalla', async ({ page }) => {
    await page.goto('/app/incentivos3');
    const dialogo = page.getByRole('dialog', { name: 'Selecciona Nivel' });
    await dialogo.getByRole('button', { name: 'Asesores' }).click();

    for (const columna of ['Asesor', 'Unidad', 'Corredor', 'Territorio']) {
      await expect(dialogo.getByRole('columnheader', { name: columna })).toBeVisible();
    }

    // El diálogo entra en la pantalla; lo que no cabe se desplaza dentro de él.
    const caja = (await dialogo.boundingBox())!;
    expect(caja.x).toBeGreaterThanOrEqual(0);
    expect(caja.x + caja.width).toBeLessThanOrEqual(375);
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde).toBeLessThanOrEqual(1);
  });
});
