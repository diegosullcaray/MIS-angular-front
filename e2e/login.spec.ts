import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { bloquearGoogle } from './fixtures/google';

test.describe('Login', () => {
  test('sin sesión de Google previa, muestra el botón "Continuar con Google"', async ({ page }) => {
    await bloquearGoogle(page);
    const login = new LoginPage(page);

    await login.ir();

    await expect(login.botonGoogle).toBeVisible();
  });
});

// En móvil el botón usaba el vidrio del panel: en modo claro quedaba blanco.
test.describe('Botón "Continuar con Google" en modo claro', () => {
  test('tiene el relleno oscuro de marca y texto claro, también en móvil', async ({ page }) => {
    await bloquearGoogle(page);
    await page.addInitScript(() =>
      localStorage.setItem('mis.preferencias', JSON.stringify({ apariencia: { tema: 'claro' } })),
    );
    await page.goto('/login');

    const colores = await page
      .getByRole('button', { name: /Continuar con Google/ })
      .evaluate((el) => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color]);
    const luminancia = (rgb: string) => {
      const [r, g, b] = rgb.match(/\d+(\.\d+)?/g)!.map(Number);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    expect(luminancia(colores[0])).toBeLessThan(110);
    expect(luminancia(colores[1])).toBeGreaterThan(200);
  });
});

for (const tema of ['claro', 'oscuro']) {
  for (const viewport of [{ width: 280, height: 640 }, { width: 1440, height: 900 }]) {
    test(`login ${tema} a ${viewport.width}px usa el fondo de marca`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await bloquearGoogle(page);
      await page.addInitScript(tema => localStorage.setItem('mis.preferencias',
        JSON.stringify({ apariencia: { tema } })), tema);
      await page.goto('/login');
      const fondo = page.locator(viewport.width < 768 ? '.login-right-panel' : '.login-banner');
      await expect(fondo).toBeVisible();
      const imagen = decodeURIComponent(await fondo.evaluate(el => getComputedStyle(el).backgroundImage));
      if (viewport.width >= 768) {
        expect(imagen).toContain('/fondos/login-banner.webp');
        await expect(page.getByRole('button', { name: /Continuar con Google/ })).toBeInViewport();
        return;
      }
      expect(imagen).toContain('/fondos/wallpaper_login_cell.png');
      await expect(page.getByRole('button', { name: /Continuar con Google/ })).toBeInViewport();
    });
  }
}
