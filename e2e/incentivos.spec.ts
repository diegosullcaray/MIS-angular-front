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

  test('con un usuario admin, abre el selector de nivel automáticamente y se puede cerrar', async ({ page }) => {
    await page.goto('/app/incentivos3');

    await expect(page.getByRole('dialog', { name: 'Selecciona Nivel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Asesores' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unidades' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Corredores' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Territorios' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'FC Individual' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'FC Grupal' })).toBeVisible();

    // Antes el diálogo no ofrecía ninguna salida en el primer ingreso de un
    // administrador. Ahora siempre tiene X: cerrarlo lleva al Home, y desde la
    // barra de la ventana se puede volver a abrir. Ver INC-2026-09-08-08.
    await expect(page.locator('.p-dialog-close-button')).toHaveCount(1);
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
