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
