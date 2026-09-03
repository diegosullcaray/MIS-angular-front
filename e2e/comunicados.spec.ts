import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionSinPreferencias, inyectarPreferencias, mockearBackendAnt } from './fixtures/session';

/**
 * Diálogo del comunicado (`AnunciosDialogComponent`).
 *
 * Es el único spec que NO usa `inyectarSesionVigente`: esa fixture silencia los
 * comunicados justamente para que su máscara modal no tape lo que prueban los
 * demás specs. Acá se entra con `localStorage` limpio, que es exactamente lo
 * que ve un usuario la primera vez.
 */
test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await inyectarSesionSinPreferencias(page);
  await mockearBackendAnt(page);
});

function visor(page: Page) {
  return page.getByRole('dialog').filter({ hasText: 'Comunicado' });
}

function imagen(page: Page) {
  return page.locator('img.mis-anuncio-imagen');
}

test('en el primer ingreso se abre solo y muestra la imagen del comunicado', async ({ page }) => {
  await page.goto('/app/dashboard');

  await expect(visor(page)).toBeVisible();
  // Una sola imagen: no hay recorrido ni paginación.
  await expect(imagen(page)).toHaveCount(1);
  await expect(imagen(page)).toHaveAttribute('src', 'assets/images/fc/ads/Comunicado.png');
});

test('cerrarlo lo da por leído y NO vuelve a abrirse en el ingreso siguiente', async ({ page }) => {
  await page.goto('/app/dashboard');
  await expect(visor(page)).toBeVisible();

  await visor(page).getByRole('button', { name: 'Entendido' }).click();
  await expect(visor(page)).toBeHidden();

  // Es la incidencia original: antes salía en cada inicio de sesión.
  await page.goto('/app/dashboard');
  await expect(page.locator('#tour-sidebar-icons')).toBeVisible();
  await expect(visor(page)).toBeHidden();
});

test('el botón de comunicados del header lo reabre aunque ya esté leído', async ({ page }) => {
  await page.goto('/app/dashboard');
  await visor(page).getByRole('button', { name: 'Entendido' }).click();
  await expect(visor(page)).toBeHidden();

  await page.locator('header').getByRole('button', { name: 'Comunicados del sistema' }).click();

  await expect(visor(page)).toBeVisible();
  await expect(imagen(page)).toHaveCount(1);
});

test('"No mostrar comunicados" los apaga para los siguientes ingresos', async ({ page }) => {
  await page.goto('/app/dashboard');
  await visor(page).getByRole('button', { name: 'No mostrar comunicados' }).click();
  await expect(visor(page)).toBeHidden();

  await page.goto('/app/dashboard');
  await expect(page.locator('#tour-sidebar-icons')).toBeVisible();
  await expect(visor(page)).toBeHidden();
});

test('la imagen entra en el diálogo sin scroll horizontal', async ({ page }) => {
  await page.goto('/app/dashboard');
  await expect(imagen(page)).toBeVisible();

  const desbordes = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('.p-dialog, .p-dialog *'))
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => `${el.tagName}.${String(el.className).slice(0, 60)}`),
  );

  expect(desbordes).toEqual([]);
});

test('con los comunicados silenciados por preferencia, no se abre', async ({ page }) => {
  await inyectarPreferencias(page, { anuncios: { vistos: [], silenciar: true } });
  await page.goto('/app/dashboard');

  await expect(page.locator('#tour-sidebar-icons')).toBeVisible();
  await expect(visor(page)).toBeHidden();
});
