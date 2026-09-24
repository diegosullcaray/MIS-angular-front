import { test, expect } from '@playwright/test';
import { ErrorPage } from './pages/error.page';
import { inyectarSesionExpirada } from './fixtures/session';
import { bloquearGoogle } from './fixtures/google';

/**
 * Cubre a nivel E2E la expiración de sesión implementada en `AuthService`:
 * una sesión con `expiraEn` en el pasado, encontrada al arrancar la app
 * (`restaurarSesion()`, ver `auth.service.ts`), se descarta y redirige a la
 * pantalla de "Sesión expirada" (`/error/401`) — sin necesidad de esperar a
 * que corra el temporizador en vivo, que ya está cubierto a nivel unitario
 * en `auth.service.spec.ts`.
 */
test.describe('Expiración de sesión', () => {
  test('una sesión ya vencida al recargar/entrar limpia sessionStorage y muestra "Sesión expirada"', async ({ page }) => {
    await inyectarSesionExpirada(page);
    await bloquearGoogle(page);

    await page.goto('/app/dashboard');

    await expect(page).toHaveURL(/\/error\/401$/);
    const errorPage = new ErrorPage(page);
    await expect(errorPage.titulo).toHaveText('Sesión expirada');

    const sesionRestante = await page.evaluate(() => window.sessionStorage.getItem('mis.sesion'));
    expect(sesionRestante).toBeNull();
  });

  // El borrado total volvía el tema al de fábrica (oscuro) justo antes de
  // mostrar "Sesión expirada": quien trabajaba en claro la veía en oscuro.
  test('en modo claro, la pantalla de sesión expirada sigue en claro y no se guarda nada', async ({ page }) => {
    await page.addInitScript(() => {
      // Solo la primera carga: la preferencia que tenía la persona antes de expirar.
      if (!sessionStorage.getItem('e2e.tema-sembrado')) {
        localStorage.setItem('mis.preferencias', JSON.stringify({ apariencia: { tema: 'claro' } }));
        sessionStorage.setItem('e2e.tema-sembrado', '1');
      }
    });
    await inyectarSesionExpirada(page);
    await bloquearGoogle(page);

    await page.goto('/app/dashboard');

    await expect(page).toHaveURL(/\/error\/401$/);
    await expect(new ErrorPage(page).titulo).toHaveText('Sesión expirada');
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);
    // El borrado total se mantiene: el tema vive solo en memoria.
    expect(await page.evaluate(() => localStorage.getItem('mis.preferencias'))).toBeNull();
  });
});
