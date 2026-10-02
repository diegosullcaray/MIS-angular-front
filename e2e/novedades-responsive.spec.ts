import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';

for (const width of [280, 390, 640]) {
  test(`novedades se puede cerrar tras desplazarse y reabrir a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 360 });
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
    await page.goto('/app/dashboard');
    const panel = page.locator('#novedades-panel');
    const abrir = page.getByRole('button', { name: 'Mostrar el panel de novedades' });
    const cerrar = page.getByRole('button', { name: 'Ocultar el panel de novedades' });
    await abrir.click();
    await expect(panel).not.toHaveAttribute('inert');
    await expect(panel).toHaveCSS('transform', 'none');
    await panel.evaluate(el => { el.scrollTop = el.scrollHeight; });
    expect(await panel.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    // No permitir que Playwright desplace el panel hasta el botón: el usuario
    // debe poder tocar el cierre desde el final de la lista.
    await expect(cerrar).toBeInViewport({ ratio: 1 });
    const caja = await cerrar.boundingBox();
    expect(Math.round(caja!.width)).toBeGreaterThanOrEqual(44);
    expect(Math.round(caja!.height)).toBeGreaterThanOrEqual(44);
    const x = caja!.x + caja!.width / 2;
    const y = caja!.y + caja!.height / 2;
    if (test.info().project.use.hasTouch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await expect(panel).toHaveAttribute('inert');
    await abrir.click();
    await expect(panel).not.toHaveAttribute('inert');
    await expect(cerrar).toBeInViewport({ ratio: 1 });
    await expect(page.locator('app-header img')).toHaveCount(0);
    if (width < 640) await expect(page.locator('.header-breadcrumb')).toBeHidden();
  });
}

for (const tema of ['claro', 'oscuro']) {
  test(`desktop ${tema}: fondo continuo, novedades con fondo y cabecera sin logo`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
    await page.addInitScript(tema => {
      const prefs = JSON.parse(localStorage.getItem('mis.preferencias') || '{}');
      prefs.apariencia = { tema };
      localStorage.setItem('mis.preferencias', JSON.stringify(prefs));
    }, tema);
    await page.goto('/app/dashboard');
    await expect(page.locator('.header-breadcrumb')).toBeVisible();
    await expect(page.locator('app-header img')).toHaveCount(0);
    await expect(page.locator('.shell-wallpaper')).toHaveCSS('background-size', /cover$/);
    await expect(page.locator('.novedades')).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('.novedades')).toHaveCSS('backdrop-filter', 'saturate(1.1) blur(18px)');
    await expect(page.locator('.novedades')).toHaveCSS('border-left-width', '1px');
    const fondo = decodeURIComponent(await page.locator('.shell-wallpaper').evaluate(el => getComputedStyle(el).backgroundImage));
    expect(fondo).toContain('/avatars/pachi/Copia de 002.png');
    expect(fondo).toContain('/avatars/mapu/02(1).png');
  });
}
