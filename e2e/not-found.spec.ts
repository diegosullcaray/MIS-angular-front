import { test, expect } from '@playwright/test';
import { NotFoundPage } from './pages/not-found.page';

test.describe('Ruta desconocida (404)', () => {
  test('una URL que no existe muestra la página "Página no encontrada" con un enlace a Mi espacio', async ({ page }) => {
    await page.goto('/esta-ruta-no-existe-en-ningun-lado');
    const notFound = new NotFoundPage(page);

    await expect(notFound.titulo).toHaveText('Página no encontrada');
    await expect(page.getByText('404')).toBeVisible();
    await expect(notFound.enlaceVolver).toBeVisible();
  });
});
