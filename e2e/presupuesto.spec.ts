import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';

/**
 * Smoke test de las 7 pantallas migradas de "presupuesto": solo confirma que
 * cada ruta renderiza sin errores de consola (p. ej. el error real que
 * `ngc --noEmit` no llegó a detectar en ResponsablesComponent — un mismatch
 * de tipos genéricos que sí rompía la compilación real de `ng build`/`ng
 * serve`). No hay datos reales del backend (mockeado con éxito vacío), así
 * que las pantallas quedan en su estado "sin selección" — no se prueba la
 * lógica de negocio acá, eso ya está cubierto a nivel unitario.
 */
const RUTAS = [
  '/app/presupuesto',
  '/app/presupuesto/lineas/activos/car-cre',
  '/app/presupuesto/lineas/pasivos-patrimonio/car-dep-bp',
  '/app/presupuesto/lineas/pasivos-patrimonio/car-dep-red',
  '/app/presupuesto/lineas/pasivos-patrimonio/seg-com',
  '/app/presupuesto/lineas/pasivos-patrimonio/seg-ope',
  '/app/presupuesto/gestion/sistema/resp',
  '/app/presupuesto/gestion/seguimiento/tbl-ver',
];

test.describe('Presupuesto — smoke de las 7 pantallas migradas', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  for (const ruta of RUTAS) {
    test(`${ruta} renderiza sin errores de consola`, async ({ page }) => {
      const erroresConsola: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') erroresConsola.push(msg.text());
      });
      page.on('pageerror', (err) => erroresConsola.push(err.message));

      await page.goto(ruta);
      await page.waitForLoadState('networkidle');

      expect(erroresConsola).toEqual([]);
    });
  }

  test('Cartera Créditos muestra sus 3 tabs', async ({ page }) => {
    await page.goto('/app/presupuesto/lineas/activos/car-cre');

    await expect(page.getByRole('tab', { name: 'Variables' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Comp. Prod. Monto' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Comp. Prod. Ratio' })).toBeVisible();
  });

  test('Responsables muestra el selector de nivel y la tabla de columnas esperadas', async ({ page }) => {
    await page.goto('/app/presupuesto/gestion/sistema/resp');

    await expect(page.getByText('Correo')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Elemento' })).toBeVisible();
  });

  test('Tablero de Verificación muestra los 2 selectores de jerarquía', async ({ page }) => {
    await page.goto('/app/presupuesto/gestion/seguimiento/tbl-ver');

    await expect(page.getByRole('button', { name: 'Elegir línea' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Elegir segundo nivel' })).toBeVisible();
  });
});
