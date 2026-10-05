import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';

/**
 * Todo `app-window-panel` llena el alto de la zona de contenido, traiga muchos o pocos datos
 * (`.mis-window { min-height: calc(100vh - 130px) }`). Estas pantallas usaban el modo de alto
 * automático, ya retirado, y se encogían al contenido.
 */
for (const ruta of ['/app/dashboards', '/app/ranking-k', '/app/consulta-fen']) {
  test(`el panel de ${ruta} ocupa el alto completo aunque tenga poco contenido`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
    await page.goto(ruta);

    const ventana = page.locator('.mis-window').first();
    await expect(ventana).toBeVisible();
    await expect.poll(async () => (await ventana.boundingBox())!.height).toBeGreaterThanOrEqual(900 - 130 - 1);
  });
}
