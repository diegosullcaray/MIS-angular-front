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

  test('Apariencia: elegir un fondo lo aplica y lo deja guardado', async ({ page }) => {
    const dialogo = await abrirConfiguracion(page);
    await dialogo.getByRole('button', { name: 'General', exact: true }).click();
    await dialogo.getByRole('button', { name: 'Apariencia' }).click();

    await dialogo.getByRole('button', { name: /^Navy/ }).click();

    // El fondo se pinta por variable CSS inline en <html>, que gana a tokens.css.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--mis-wallpaper-color')))
      .toBe('#1d396e');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('mis.preferencias')))
      .toContain('"fondo":"navy"');
  });

  test('Apariencia: el selector de color se abre y no queda recortado por el diálogo', async ({ page }) => {
    const dialogo = await abrirConfiguracion(page);
    await dialogo.getByRole('button', { name: 'General', exact: true }).click();
    await dialogo.getByRole('button', { name: 'Apariencia' }).click();

    await page.locator('.p-colorpicker-preview').first().click();

    const panel = page.locator('.p-colorpicker-panel');
    await expect(panel).toBeVisible();

    // Regresión: montado dentro del diálogo (el `appendTo` por defecto es
    // `self`), el panel quedaba DEBAJO de la máscara modal —visible pero
    // inerte: los clicks los recibía la máscara y el selector no se podía
    // usar—. Lo que se afirma no es que se vea, es que reciba el puntero.
    const alcanzable = await page.evaluate(() => {
      const p = document.querySelector<HTMLElement>('.p-colorpicker-panel');
      if (!p) return 'sin panel';
      const r = p.getBoundingClientRect();
      const encima = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return encima && p.contains(encima) ? 'ok' : `tapado por ${encima?.className ?? 'nada'}`;
    });
    expect(alcanzable).toBe('ok');

    // Y entero dentro del viewport: nada del selector queda fuera de pantalla.
    const caja = (await panel.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(caja.x).toBeGreaterThanOrEqual(0);
    expect(caja.y).toBeGreaterThanOrEqual(0);
    expect(caja.x + caja.width).toBeLessThanOrEqual(viewport.width);
    expect(caja.y + caja.height).toBeLessThanOrEqual(viewport.height);
  });

  test('ninguna pantalla del diálogo genera scroll horizontal, ni en una columna angosta', async ({ page }) => {
    // Regresión: `p-toggleswitch` tiene 34px de ancho intrínseco y, sin
    // `flex-shrink: 0`, al angostarse la columna el flex lo aplastaba y el
    // excedente salía como scroll horizontal.
    await page.setViewportSize({ width: 820, height: 720 });
    const dialogo = await abrirConfiguracion(page);
    await dialogo.getByRole('button', { name: 'General', exact: true }).click();

    for (const item of ['Apariencia', 'Estructura', 'Anuncios']) {
      await dialogo.getByRole('button', { name: item, exact: true }).click();
      await expect(dialogo.getByRole('region', { name: item })).toBeVisible();

      const desbordes = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('.p-dialog, .p-dialog *'))
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .filter((el) => {
            const ox = getComputedStyle(el).overflowX;
            return ox === 'visible' || ox === 'auto' || ox === 'scroll';
          })
          .map((el) => `${el.tagName}.${String(el.className).slice(0, 60)}`),
      );

      expect(desbordes, `pantalla "${item}"`).toEqual([]);
    }
  });

  test('Anuncios y Notificaciones son dos ajustes distintos, con íconos distintos', async ({ page }) => {
    const dialogo = await abrirConfiguracion(page);
    await dialogo.getByRole('button', { name: 'General', exact: true }).click();

    const anuncios = dialogo.getByRole('button', { name: 'Anuncios', exact: true });
    const notificaciones = dialogo.getByRole('button', { name: 'Notificaciones', exact: true });
    await expect(anuncios).toBeVisible();
    await expect(notificaciones).toBeVisible();

    // El megáfono es de comunicados; la campana, de notificaciones.
    await expect(anuncios.locator('i').first()).toHaveClass(/pi-megaphone/);
    await expect(notificaciones.locator('i').first()).toHaveClass(/pi-bell/);
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