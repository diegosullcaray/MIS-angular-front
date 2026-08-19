import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';
import { ShellPage } from './pages/shell.page';

/**
 * Diálogo "Configuración" (menú de perfil del header) — ver
 * `ConfiguracionDialogComponent`. Cubre que la opción esté al alcance de
 * cualquier usuario y que el maestro-detalle navegue en ambos viewports: en
 * desktop las tres columnas conviven, en mobile se recorren una a una.
 */
test.beforeEach(async ({ page }) => {
  await inyectarSesionVigente(page);
  await mockearBackendAnt(page);
});

async function abrirConfiguracion(page: Page) {
  const shell = new ShellPage(page);
  await shell.ir();
  await shell.botonMenuUsuario.click();
  await page.getByRole('menuitem', { name: 'Configuración' }).click();
  return page.getByRole('dialog').filter({ hasText: 'Configuración' });
}

test.describe('Configuración — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('el menú de perfil abre el diálogo en la primera sección y su primer item', async ({ page }) => {
    const dialogo = await abrirConfiguracion(page);

    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Cuenta' })).toHaveAttribute('aria-current', 'true');
    await expect(dialogo.getByRole('region', { name: 'Información general' })).toBeVisible();
  });

  test('las tres columnas conviven: elegir una sección cambia sus items sin ocultar el menú', async ({ page }) => {
    const dialogo = await abrirConfiguracion(page);

    await dialogo.getByRole('button', { name: 'Seguridad' }).click();

    await expect(dialogo.getByRole('complementary', { name: 'Secciones de configuración' })).toBeVisible();
    await expect(dialogo.getByRole('complementary', { name: 'Seguridad' })).toBeVisible();
    // Al cambiar de sección el detalle salta a su primer item, no queda en el anterior.
    await expect(dialogo.getByRole('region', { name: 'Sesiones activas' })).toBeVisible();

    await dialogo.getByRole('button', { name: 'Autenticación de dos factores' }).click();
    await expect(dialogo.getByRole('region', { name: 'Autenticación de dos factores' })).toBeVisible();
  });

  test('el buscador filtra el árbol de ajustes', async ({ page }) => {
    const dialogo = await abrirConfiguracion(page);

    await dialogo.getByRole('searchbox', { name: 'Buscar ajuste' }).fill('apariencia');

    await expect(dialogo.getByRole('button', { name: 'General', exact: true })).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Seguridad' })).toHaveCount(0);
  });
});

test.describe('Configuración — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('se recorre una columna a la vez y el botón de volver regresa al paso anterior', async ({ page }) => {
    const dialogo = await abrirConfiguracion(page);

    const secciones = dialogo.getByRole('complementary', { name: 'Secciones de configuración' });
    await expect(secciones).toBeVisible();

    await dialogo.getByRole('button', { name: 'General', exact: true }).click();
    await expect(secciones).toBeHidden();
    const items = dialogo.getByRole('complementary', { name: 'General', exact: true });
    await expect(items).toBeVisible();

    await dialogo.getByRole('button', { name: 'Apariencia' }).click();
    await expect(items).toBeHidden();
    await expect(dialogo.getByRole('region', { name: 'Apariencia' })).toBeVisible();

    await dialogo.getByRole('button', { name: 'Volver a General' }).click();
    await expect(items).toBeVisible();

    await dialogo.getByRole('button', { name: 'Volver a las secciones' }).click();
    await expect(secciones).toBeVisible();
  });
});
