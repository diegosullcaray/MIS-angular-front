import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';

/**
 * Un solo indicador de carga.
 *
 * El defecto era visible: al abrir un reporte se encendian DOS indicadores
 * para una sola espera — la mascara con spinner que PrimeNG pinta sobre la
 * tabla cuando `p-table [loading]` esta activo, y el overlay global a
 * pantalla completa por encima.
 *
 * El indicador unico es el overlay global (`app-loading-overlay`). Las tablas
 * conservan el estado como `aria-busy`, que no se ve pero se anuncia.
 */

test.beforeEach(async ({ page }) => {
  await inyectarSesionVigente(page);
  await mockearBackendAnt(page);
});

test('mientras carga hay UN solo indicador: el overlay global, sin mascara sobre la tabla', async ({ page }) => {
  let liberar: (() => void) | undefined;
  const retenido = new Promise<void>((r) => (liberar = r));
  await page.route('**/v1/g**', async (route) => {
    await retenido;
    await route.fallback();
  });

  const navegacion = page.goto('/app/reportes');

  const overlay = page.locator('.loading-overlay-wrapper');
  await expect(overlay).toBeVisible({ timeout: 10_000 });

  // La mascara con spinner de PrimeNG sobre la tabla ya no debe existir.
  await expect(page.locator('.p-datatable-mask')).toHaveCount(0);
  await expect(page.locator('.p-datatable-loading-overlay')).toHaveCount(0);

  liberar!();
  await navegacion;
  await expect(overlay).toHaveCount(0);
});
