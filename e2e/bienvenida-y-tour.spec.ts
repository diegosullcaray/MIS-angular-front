import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionSinPreferencias, inyectarPreferencias, mockearBackendAnt } from './fixtures/session';

/**
 * La bienvenida de Pachi y el recorrido guiado en pantalla angosta.
 *
 * Este spec entra **sin preferencias**, que es lo que ve alguien la primera
 * vez: el resto de la suite las siembra justamente para que la máscara de la
 * bienvenida no tape lo que prueban.
 */

function bienvenida(page: Page) {
  return page.getByRole('dialog').filter({ hasText: 'Te damos la bienvenida' });
}

function globo(page: Page) {
  return page.locator('.driver-popover');
}

function pachi(page: Page) {
  return page.locator('.driver-popover .mis-tour-mascota');
}

test.describe('Bienvenida de Pachi', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesionSinPreferencias(page);
    await mockearBackendAnt(page);
  });

  test('en el primer ingreso se abre sola, saluda y nombra las novedades', async ({ page }) => {
    await page.goto('/app/dashboard');

    await expect(bienvenida(page)).toBeVisible();
    await expect(bienvenida(page)).toContainText('Pachi');
    await expect(bienvenida(page)).toContainText('Filtros y actualizar');
  });

  test('cerrarla la da por vista y no vuelve en el siguiente ingreso', async ({ page }) => {
    await page.goto('/app/dashboard');
    await bienvenida(page).getByRole('button', { name: 'Entrar directo' }).click();
    await expect(bienvenida(page)).toBeHidden();

    await page.goto('/app/dashboard');
    await expect(page.locator('#tour-sidebar-icons')).toBeVisible();
    await expect(bienvenida(page)).toBeHidden();
  });

  test('"Ver las novedades" la cierra y levanta el panel', async ({ page }) => {
    await page.goto('/app/dashboard');

    await bienvenida(page).getByRole('button', { name: 'Ver las novedades' }).click();

    await expect(bienvenida(page)).toBeHidden();
    await expect(page.locator('#novedades-panel')).not.toHaveClass(/novedades--cerrado/);
  });

  // Dos modales apilados en el primer ingreso es peor que ninguno.
  test('el comunicado espera a que la bienvenida se cierre', async ({ page }) => {
    await page.goto('/app/dashboard');

    await expect(bienvenida(page)).toBeVisible();
    await expect(page.getByRole('dialog').filter({ hasText: 'Comunicado' })).toBeHidden();
  });
});

test.describe('El recorrido guiado entra en un teléfono', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await inyectarSesionSinPreferencias(page);
    await inyectarPreferencias(page, { anuncios: { vistos: [], silenciar: true }, bienvenida: { vista: true } });
    await mockearBackendAnt(page);
    await page.goto('/app/dashboard');
    await expect(page.locator('#tour-sidebar-icons')).toBeVisible();
  });

  async function abrirPanel(page: Page): Promise<void> {
    await page.locator('.novedades-pestania').click();
    await expect(page.locator('#novedades-panel')).not.toHaveClass(/novedades--cerrado/);
  }

  /**
   * El defecto que motivó el cambio: Pachi colgaba por fuera del globo
   * (`left: -75px`) y con el globo a ancho casi completo terminaba en x negativa,
   * fuera de la pantalla.
   */
  test('Pachi queda dentro del viewport en cada paso', async ({ page }) => {
    await abrirPanel(page);
    await page.locator('.novedad').first().click();
    await expect(globo(page)).toBeVisible();

    for (let paso = 0; paso < 3; paso++) {
      await expect(pachi(page)).toBeVisible();
      const caja = await pachi(page).boundingBox();
      expect(caja).not.toBeNull();
      expect(caja!.x).toBeGreaterThanOrEqual(0);
      expect(caja!.x + caja!.width).toBeLessThanOrEqual(375);

      const siguiente = page.locator('.driver-popover-next-btn');
      if (!(await siguiente.isVisible())) break;
      await siguiente.click();
      await page.waitForTimeout(250);
    }
  });

  test('el globo tampoco se sale de la pantalla', async ({ page }) => {
    await abrirPanel(page);
    await page.locator('.novedad').first().click();
    await expect(globo(page)).toBeVisible();

    const caja = await globo(page).boundingBox();
    expect(caja!.x).toBeGreaterThanOrEqual(0);
    expect(caja!.x + caja!.width).toBeLessThanOrEqual(375);
  });

  /**
   * El panel está encima de la pantalla: si queda abierto, el recorrido resalta
   * algo que el propio panel está tapando.
   */
  test('el panel se aparta cuando el recorrido señala la pantalla', async ({ page }) => {
    await abrirPanel(page);

    await page.locator('.novedad').filter({ hasText: 'Tu escritorio de inicio' }).click();

    await expect(page.locator('#novedades-panel')).toHaveClass(/novedades--cerrado/);
    await expect(globo(page)).toBeVisible();
  });
});
