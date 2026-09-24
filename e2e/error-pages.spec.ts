import { test, expect } from '@playwright/test';
import { ErrorPage } from './pages/error.page';

test.describe('Página genérica de error HTTP (/error/:code)', () => {
  test('401 muestra "Sesión expirada" y el botón redirige a /login', async ({ page }) => {
    const errorPage = new ErrorPage(page);
    await errorPage.ir(401);

    await expect(errorPage.titulo).toHaveText('Sesión expirada');
    await expect(page.getByText(/tu sesión venció o no es válida/i)).toBeVisible();

    await errorPage.botonAccion('Ir a iniciar sesión').click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('403 muestra "Acceso denegado"', async ({ page }) => {
    const errorPage = new ErrorPage(page);
    await errorPage.ir(403);

    await expect(errorPage.titulo).toHaveText('Acceso denegado');
  });

  test('404 (numérico, vía /error/404) usa el fallback correcto del mapeo de errores', async ({ page }) => {
    const errorPage = new ErrorPage(page);
    await errorPage.ir(404);

    await expect(errorPage.titulo).toHaveText('No encontrado');
  });
});

test.describe('Tema de las páginas de error', () => {
  /** Luminancia aproximada del color que se ve en el centro-arriba del fondo, fuera de la tarjeta. */
  async function fondoEsOscuro(page: import('@playwright/test').Page): Promise<boolean> {
    const pixel = await page.screenshot({ clip: { x: 10, y: 10, width: 1, height: 1 } });
    // PNG 1×1: el primer píxel está después del encabezado; se compara con la captura decodificada por el navegador.
    return page.evaluate(async (base64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${base64}`;
      await img.decode();
      const lienzo = document.createElement('canvas');
      lienzo.width = lienzo.height = 1;
      const ctx = lienzo.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b < 100;
    }, pixel.toString('base64'));
  }

  // El tema lo decide la preferencia que guarda el layout; la página no trae su
  // propio alternador. En claro el fondo sigue siendo oscuro: un degradado de marca.
  for (const tema of ['claro', 'oscuro'] as const) {
    for (const ruta of ['/error/500', '/ruta-que-no-existe']) {
      test(`${ruta} con tema ${tema}: sigue la preferencia y el fondo es un degradado oscuro`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem('mis.preferencias', JSON.stringify({ apariencia: { tema: t } })), tema);
        await page.goto(ruta);

        await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(tema === 'oscuro');
        await expect(page.getByRole('button', { name: /Activar modo/ })).toHaveCount(0);
        const fondo = await page.locator('.error-fondo').evaluate((el) => getComputedStyle(el).backgroundImage);
        expect(fondo).toContain('linear-gradient');
        expect(await fondoEsOscuro(page)).toBe(true);
      });
    }
  }
});
