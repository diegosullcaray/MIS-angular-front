import { test, expect } from '@playwright/test';
import { ShellPage } from './pages/shell.page';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';

/**
 * Cubre a nivel E2E el rediseño responsive del shell (Col 1 del sidebar
 * como barra inferior fija en mobile, estilo Facebook; breadcrumb del header
 * visible en todo viewport, que es el único lugar donde vive la ubicación;
 * Col 2 eliminada en todo viewport, porque la navegación
 * vive enteramente en el explorador del sistema) — ver `sidebar.component.html`
 * y `header.component.html`.
 *
 * El viewport se fija explícitamente en cada bloque (en vez de depender del
 * proyecto de Playwright) para que el spec sea autocontenido sin importar
 * qué proyectos estén configurados.
 */
test.describe('Shell responsive — mobile (< 640px, breakpoint `sm` de Tailwind)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('Col 1 (íconos de sistemas) se ancla al fondo del viewport, estilo Facebook', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    const cajaRail = await shell.railIconos.boundingBox();
    const alturaViewport = page.viewportSize()!.height;

    expect(cajaRail).not.toBeNull();
    // El borde inferior del rail debe estar pegado al fondo del viewport.
    expect(cajaRail!.y + cajaRail!.height).toBeGreaterThanOrEqual(alturaViewport - 2);
  });

  // Antes se ocultaba por espacio y la ubicación se dibujaba dentro del panel
  // del explorador. Esa copia se eliminó (el breadcrumb vive solo en el header)
  // y el hueco que dejó el wordmark al mudarse al rail alcanza para mostrarlo:
  // es la única forma de subir de nivel, así que en mobile tiene que estar.
  test('el breadcrumb del header es visible: es el único lugar donde vive la ubicación', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    await expect(shell.breadcrumb).toBeVisible();
  });

  test('no hay ningún botón para abrir la Col 2: la navegación vive en el explorador del sistema', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    await expect(shell.botonHamburguesaDelHeader).toHaveCount(0);
    await expect(shell.botonHamburguesaDelRail).toHaveCount(0);
  });

  test('usa el wallpaper de mobile (wallpaper_cell.png)', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    expect(await shell.wallpaperAplicado()).toContain('wallpaper_cell.png');
  });
});

test.describe('Shell responsive — desktop (>= 640px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('Col 1 es un rail vertical fijo al costado izquierdo, no una barra inferior', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    const cajaRail = await shell.railIconos.boundingBox();
    const alturaViewport = page.viewportSize()!.height;

    expect(cajaRail).not.toBeNull();
    expect(cajaRail!.x).toBeLessThan(10);
    // A diferencia de mobile, ocupa casi toda la altura del viewport en vez de una franja de 64px al fondo.
    expect(cajaRail!.height).toBeGreaterThan(alturaViewport * 0.8);
  });

  test('el breadcrumb del header es visible', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    await expect(shell.breadcrumb).toBeVisible();
  });

  test('no hay ningún botón para abrir la Col 2: la navegación vive en el explorador del sistema', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    await expect(shell.botonHamburguesaDelRail).toHaveCount(0);
    await expect(shell.botonHamburguesaDelHeader).toHaveCount(0);
  });

  test('usa el wallpaper de escritorio (wallpaper.png), no el de mobile', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    const wallpaper = await shell.wallpaperAplicado();
    expect(wallpaper).toContain('wallpaper.png');
    expect(wallpaper).not.toContain('wallpaper_cell.png');
  });
});
