import { test, expect } from '@playwright/test';
import { ShellPage } from './pages/shell.page';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';

/**
 * Cubre a nivel E2E el rediseño responsive del shell (Col 1 del sidebar
 * como barra inferior fija en mobile, estilo Facebook; breadcrumb oculto en
 * mobile; botón de alternar Col 2 movido al header solo en mobile) — ver
 * `sidebar.component.html` y `header.component.html`.
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

  test('el breadcrumb del header queda oculto', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    await expect(shell.breadcrumb).toBeHidden();
  });

  test('el botón de alternar el panel (Col 2) vive en el header, no en el rail', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    await expect(shell.botonHamburguesaDelHeader).toBeVisible();
    await expect(shell.botonHamburguesaDelRail).toBeHidden();
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

  test('el botón de alternar el panel (Col 2) vive en el rail, no en el header', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.ir();

    await expect(shell.botonHamburguesaDelRail).toBeVisible();
    await expect(shell.botonHamburguesaDelHeader).toBeHidden();
  });
});
