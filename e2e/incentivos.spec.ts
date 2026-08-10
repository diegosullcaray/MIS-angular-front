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

  test('con un usuario admin, abre el selector de nivel automáticamente y sin botón de cerrar', async ({ page }) => {
    await page.goto('/app/incentivos3');

    await expect(page.getByRole('dialog', { name: 'Selecciona Nivel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Asesores' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unidades' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Corredores' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Territorios' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'FC Individual' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'FC Grupal' })).toBeVisible();

    // Diálogo obligatorio (aún no se eligió ningún nivel) — sin ícono de cerrar de PrimeNG.
    await expect(page.locator('.p-dialog-close-button')).toHaveCount(0);
  });

  test('elegir "Asesores" muestra el buscador de colaboradores', async ({ page }) => {
    await page.goto('/app/incentivos3');
    await page.getByRole('button', { name: 'Asesores' }).click();

    await expect(page.getByPlaceholder('Buscar asesor…')).toBeVisible();
  });
});
