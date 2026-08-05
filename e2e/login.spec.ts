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
