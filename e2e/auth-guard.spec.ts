import { test, expect } from '@playwright/test';
import { bloquearGoogle } from './fixtures/google';

test.describe('authGuard (rutas protegidas bajo /app)', () => {
  test('sin sesión activa, entrar directo a /app/dashboard redirige a /login', async ({ page }) => {
    await bloquearGoogle(page);

    await page.goto('/app/dashboard');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('sin sesión activa, entrar a cualquier ruta de /app redirige igual a /login', async ({ page }) => {
    await bloquearGoogle(page);

    await page.goto('/app/ranking-k');

    await expect(page).toHaveURL(/\/login$/);
  });
});
