import { test, expect } from '@playwright/test';
import { ShellPage } from './pages/shell.page';
import {
  inyectarSesionVigente,
  inyectarSesionConAlternates,
  inyectarSesionComoAlterno,
  mockearBackendAnt,
  USUARIO_DE_PRUEBA,
  type AlternateDePrueba,
} from './fixtures/session';

/**
 * Smoke test de "Cambiar usuario" (menú de perfil del header) — migra la
 * funcionalidad de `AltUserDialogComponent`/`AdminService` de STG con un
 * diseño de selector de cuentas estilo Google (ver `CambiarUsuarioDialogComponent`).
 *
 * Los pedidos al backend Ant van cifrados en la URL (`?w=<cipher>`), así que
 * no se puede mockear una respuesta distinta para `altLogin` sin descifrar
 * el payload — por eso este spec cubre el camino de UI (qué se muestra y
 * cómo se abre/cierra el diálogo), y usa sesiones ya "en modo alterno"
 * inyectadas directamente para probar el revert sin depender del backend.
 */
const ALTERNATE: AlternateDePrueba = { email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz', cargo: 'Supervisor' };

test.describe('Cambiar usuario — menú de perfil', () => {
  test('sin alternates asignados, no se muestra "Cambiar usuario"', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await shell.botonMenuUsuario.click();

    await expect(shell.dropdownUsuario).toContainText(USUARIO_DE_PRUEBA.nombre);
    await expect(page.getByRole('menuitem', { name: 'Cambiar usuario' })).toHaveCount(0);
  });

  test('con alternates asignados, muestra "Cambiar usuario" y abre el selector de cuentas', async ({ page }) => {
    await inyectarSesionConAlternates(page, [ALTERNATE]);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await shell.botonMenuUsuario.click();
    await page.getByRole('menuitem', { name: 'Cambiar usuario' }).click();

    await expect(page.getByRole('dialog', { name: 'Cambiar de cuenta' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Carlos Ruiz/ })).toBeVisible();
  });

  test('viendo como un usuario alterno, muestra "Mi usuario" y no permite abrir "Cambiar usuario" de nuevo', async ({ page }) => {
    const perfilAlterno = { ...USUARIO_DE_PRUEBA, id: 'e2e-alt', email: ALTERNATE.email, nombre: ALTERNATE.nombre };
    await inyectarSesionComoAlterno(page, perfilAlterno, [ALTERNATE]);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await shell.botonMenuUsuario.click();

    await expect(shell.dropdownUsuario).toContainText(ALTERNATE.nombre);
    await expect(page.getByRole('menuitem', { name: 'Mi usuario' })).toBeVisible();
    // En modo alterno no se puede volver a abrir "Cambiar usuario" (ya se está viendo como otro).
    await expect(page.getByRole('menuitem', { name: 'Cambiar usuario' })).toHaveCount(0);
  });

  test('"Mi usuario" revierte a la identidad original sin llamar al backend', async ({ page }) => {
    const perfilAlterno = { ...USUARIO_DE_PRUEBA, id: 'e2e-alt', email: ALTERNATE.email, nombre: ALTERNATE.nombre };
    await inyectarSesionComoAlterno(page, perfilAlterno, [ALTERNATE]);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await shell.botonMenuUsuario.click();
    await page.getByRole('menuitem', { name: 'Mi usuario' }).click();

    await shell.botonMenuUsuario.click();
    await expect(shell.dropdownUsuario).toContainText(USUARIO_DE_PRUEBA.nombre);
    await expect(page.getByRole('menuitem', { name: 'Cambiar usuario' })).toBeVisible();
  });
});
