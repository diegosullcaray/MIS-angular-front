import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
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
 * Cambio de perfil desde el header (ADR-0005).
 *
 * El menú de identidad expone una sola acción, **Cambiar perfil**, que abre un
 * diálogo con los perfiles autorizados. La cuenta elegida solo se aplica al
 * confirmar: así se evita el cambio accidental y se conserva la paridad con
 * `AltUserDialogComponent` de STG.
 *
 * Los pedidos al backend Ant van cifrados en la URL (`?w=<cipher>`), así que
 * no se puede mockear una respuesta distinta para `altLogin` sin descifrar el
 * payload: este spec cubre el camino de UI y usa sesiones ya "en modo alterno"
 * inyectadas directamente para probar la vuelta sin depender del backend.
 */
const ALTERNATE: AlternateDePrueba = { email: 'carlos.ruiz@confianza.pe', nombre: 'Carlos Ruiz', cargo: 'Supervisor' };

function dialogoPerfil(page: Page) {
  return page.getByRole('dialog').filter({ hasText: 'Selecciona el perfil con el que deseas continuar' });
}

async function abrirSelector(page: Page, shell: ShellPage) {
  await shell.botonMenuUsuario.click();
  await page.getByRole('menuitem', { name: 'Cambiar perfil' }).click();
  await expect(dialogoPerfil(page)).toBeVisible();
}

test.describe('Cambio de perfil — menú del header', () => {
  test('sin alternates asignados, el menú no ofrece cambiar de perfil', async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await shell.botonMenuUsuario.click();

    await expect(shell.dropdownUsuario).toContainText(USUARIO_DE_PRUEBA.nombre);
    await expect(page.getByRole('menuitem', { name: 'Cambiar perfil' })).toHaveCount(0);
  });

  test('con alternates, "Cambiar perfil" abre el diálogo y exige elegir antes de confirmar', async ({ page }) => {
    await inyectarSesionConAlternates(page, [ALTERNATE]);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    // El menú no lista los perfiles: solo ofrece la acción.
    await shell.botonMenuUsuario.click();
    await expect(page.getByRole('menuitem', { name: /Carlos Ruiz/ })).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Cambiar perfil' }).click();

    const dialogo = dialogoPerfil(page);
    await expect(dialogo).toBeVisible();
    const opcion = dialogo.getByRole('option', { name: /Carlos Ruiz/ });
    await expect(opcion).toContainText('Supervisor');

    const confirmar = dialogo.getByRole('button', { name: 'Cambiar perfil' });
    await expect(confirmar).toBeDisabled();
    await opcion.click();
    await expect(opcion).toHaveAttribute('aria-selected', 'true');
    await expect(confirmar).toBeEnabled();
  });

  test('cancelar cierra el diálogo sin cambiar la identidad', async ({ page }) => {
    await inyectarSesionConAlternates(page, [ALTERNATE]);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await abrirSelector(page, shell);
    await dialogoPerfil(page).getByRole('option', { name: /Carlos Ruiz/ }).click();
    await dialogoPerfil(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogoPerfil(page)).toBeHidden();

    await shell.botonMenuUsuario.click();
    await expect(shell.dropdownUsuario).toContainText(USUARIO_DE_PRUEBA.nombre);
  });

  test('viendo como un usuario alterno, la identidad propia aparece como un perfil más del diálogo', async ({ page }) => {
    const perfilAlterno = { ...USUARIO_DE_PRUEBA, id: 'e2e-alt', email: ALTERNATE.email, nombre: ALTERNATE.nombre };
    await inyectarSesionComoAlterno(page, perfilAlterno, [ALTERNATE]);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await shell.botonMenuUsuario.click();
    await expect(shell.dropdownUsuario).toContainText(ALTERNATE.nombre);
    await page.getByRole('menuitem', { name: 'Cambiar perfil' }).click();

    // La vuelta no es una opción aparte: es una fila más del diálogo.
    await expect(dialogoPerfil(page).getByRole('option', { name: new RegExp(USUARIO_DE_PRUEBA.nombre) })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Mi usuario' })).toHaveCount(0);
  });

  test('confirmar la identidad propia revierte la sesión sin llamar al backend', async ({ page }) => {
    const perfilAlterno = { ...USUARIO_DE_PRUEBA, id: 'e2e-alt', email: ALTERNATE.email, nombre: ALTERNATE.nombre };
    await inyectarSesionComoAlterno(page, perfilAlterno, [ALTERNATE]);
    await mockearBackendAnt(page);
    const shell = new ShellPage(page);
    await shell.ir();
    await shell.cerrarPanelSiEstaTapandoElHeader();

    await abrirSelector(page, shell);
    await dialogoPerfil(page).getByRole('option', { name: new RegExp(USUARIO_DE_PRUEBA.nombre) }).click();
    await dialogoPerfil(page).getByRole('button', { name: 'Cambiar perfil' }).click();
    await expect(dialogoPerfil(page)).toBeHidden();

    await shell.botonMenuUsuario.click();
    await expect(shell.dropdownUsuario).toContainText(USUARIO_DE_PRUEBA.nombre);
    // De vuelta en la identidad propia, el alterno vuelve a estar disponible en el diálogo.
    await page.getByRole('menuitem', { name: 'Cambiar perfil' }).click();
    await expect(dialogoPerfil(page).getByRole('option', { name: /Carlos Ruiz/ })).toBeVisible();
  });
});
