import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';
import { ShellPage } from './pages/shell.page';

/**
 * "Configuración" está deshabilitada (`FUNCIONES_HABILITADAS.configuracion` en el layout):
 * el menú de perfil no la ofrece y la guía que llevaba hasta ella no se publica. Al volver a
 * habilitarla, restaurar desde el historial de git las pruebas del diálogo (maestro-detalle
 * en escritorio y en teléfono).
 */
test.beforeEach(async ({ page }) => {
  await inyectarSesionVigente(page);
  await mockearBackendAnt(page);
});

for (const [nombre, viewport] of [['escritorio', { width: 1280, height: 800 }], ['teléfono', { width: 390, height: 844 }]] as const) {
  test.describe(`Configuración deshabilitada — ${nombre}`, () => {
    test.use({ viewport });

    test('el menú de perfil no ofrece "Configuración", solo "Cerrar sesión"', async ({ page }) => {
      const shell = new ShellPage(page);
      await shell.ir();
      await shell.botonMenuUsuario.click();

      await expect(page.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Configuración' })).toHaveCount(0);
    });
  });
}
