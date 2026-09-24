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
