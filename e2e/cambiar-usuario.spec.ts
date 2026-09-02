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
 * Smoke test del cambio de perfil (menú del header) — migra la funcionalidad
 * de `AltUserDialogComponent`/`AdminService` de STG al selector de perfiles
 * estilo Chrome: los otros perfiles se listan en el propio menú y cambian con
 * un clic, sin diálogo de confirmación (ver `header.component.html`).
 *
 * Los pedidos al backend Ant van cifrados en la URL (`?w=<cipher>`), así que
 * no se puede mockear una respuesta distinta para `altLogin` sin descifrar
 * el payload — por eso este spec cubre el camino de UI (qué se muestra) y usa
 * sesiones ya "en modo alterno" inyectadas directamente para probar el revert
 * sin depender del backend.
 */
const ALTERNATE: AlternateDePrueba = { email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz', cargo: 'Supervisor' };

test.describe('Cambio de perfil — menú del header', () => {
  test('sin alternates asignados, no se lista ningún otro perfil', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await shell.botonMenuUsuario.click();

    await expect(shell.dropdownUsuario).toContainText(USUARIO_DE_PRUEBA.nombre);
    await expect(shell.dropdownUsuario).not.toContainText('Otros perfiles');
  });

  test('con alternates asignados, los lista en el propio menú, listos para un clic', async ({ page }) => {
    await inyectarSesionConAlternates(page, [ALTERNATE]);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await shell.botonMenuUsuario.click();

    // Sin paso intermedio: el perfil está en el menú, a un clic de distancia.
    await expect(shell.dropdownUsuario).toContainText('Otros perfiles');
    await expect(page.getByRole('menuitem', { name: /Carlos Ruiz/ })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('viendo como un usuario alterno, la identidad propia aparece como un perfil más', async ({ page }) => {
    const perfilAlterno = { ...USUARIO_DE_PRUEBA, id: 'e2e-alt', email: ALTERNATE.email, nombre: ALTERNATE.nombre };
    await inyectarSesionComoAlterno(page, perfilAlterno, [ALTERNATE]);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await shell.botonMenuUsuario.click();

    await expect(shell.dropdownUsuario).toContainText(ALTERNATE.nombre);
    // La vuelta no es una opción aparte: es una fila más de "Otros perfiles".
    await expect(shell.dropdownUsuario).toContainText('Otros perfiles');
    await expect(page.getByRole('menuitem', { name: new RegExp(USUARIO_DE_PRUEBA.nombre) })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Mi usuario' })).toHaveCount(0);
  });

  test('elegir la identidad propia revierte la sesión sin llamar al backend', async ({ page }) => {
    const perfilAlterno = { ...USUARIO_DE_PRUEBA, id: 'e2e-alt', email: ALTERNATE.email, nombre: ALTERNATE.nombre };
    await inyectarSesionComoAlterno(page, perfilAlterno, [ALTERNATE]);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await shell.botonMenuUsuario.click();
    await page.getByRole('menuitem', { name: new RegExp(USUARIO_DE_PRUEBA.nombre) }).click();

    await shell.botonMenuUsuario.click();
    await expect(shell.dropdownUsuario).toContainText(USUARIO_DE_PRUEBA.nombre);
    await expect(page.getByRole('menuitem', { name: /Carlos Ruiz/ })).toBeVisible();
  });
});
