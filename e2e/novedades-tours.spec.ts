import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

/**
 * Las guías del panel de novedades, recorridas con clics inmediatos —en plena
 * animación de driver.js—, que es como las trababa un usuario apurado:
 *
 * - driver.js ignoraba el clic de `advanceOnClick` durante la transición: la
 *   app abría la búsqueda o el menú y el recorrido no avanzaba.
 * - La búsqueda se abría sola y la lupa cambiaba de etiqueta: el último paso
 *   quedaba sin ancla y "Finalizar" no respondía.
 * - driver.js borraba el `aria-haspopup` del perfil y no lo devolvía.
 */
const GUIAS = [
  { titulo: 'Encuentra un reporte sin recorrer menús', pasos: 5, conClic: /Abre la búsqueda/ },
  // En el celular son 8: el paso del breadcrumb no aplica (el shell lo oculta).
  { titulo: 'Navega por sistemas y sus paneles', pasos: 9, conClic: /Abre un sistema|Entra a una carpeta|Abre un reporte/ },
] as const;

async function abrirGuia(page: Page, titulo: string): Promise<void> {
  await inyectarSesionVigente(page);
  await page.route('**/cores2/ant/**', (r) => r.fulfill({ json: { code: '0', headers: {}, body: {} } }));
  await page.goto('/app/dashboard');
  await page.waitForLoadState('networkidle');
  const pestania = page.locator('.novedades-pestania');
  if (await pestania.isVisible()) await pestania.click();
  await page.locator('.novedad').filter({ hasText: titulo }).click();
  await expect(page.locator('.driver-popover')).toBeVisible();
}

for (const guia of GUIAS) {
  test(`"${guia.titulo}" llega al final sin trabarse y deja la pantalla limpia`, async ({ page }) => {
    await abrirGuia(page, guia.titulo);
    const movil = (page.viewportSize()?.width ?? 1280) <= 640;
    const total = guia.titulo.startsWith('Navega') && movil ? guia.pasos - 1 : guia.pasos;

    const titulos: string[] = [];
    for (let i = 0; i < total; i++) {
      const titulo = page.locator('.driver-popover-title');
      await expect(titulo).toHaveText(/Paso \d/);
      const texto = await titulo.innerText();
      titulos.push(texto);

      // Sin esperar a que termine la animación.
      if (guia.conClic?.test(texto)) await page.locator('.driver-active-element').last().click();
      else await page.locator('.driver-popover-next-btn').click();

      // Cada clic avanza (o cierra en el último): nunca se queda en el mismo paso.
      if (i === total - 1) await expect(page.locator('.driver-popover')).toHaveCount(0, { timeout: 3_000 });
      else await expect(page.locator('.driver-popover-title')).not.toHaveText(texto, { timeout: 3_000 });
    }

    expect(titulos.map((t) => Number(/Paso (\d)/.exec(t)?.[1]))).toEqual(
      Array.from({ length: total }, (_, i) => i + 1),
    );
    await expect(page.locator('.driver-overlay, .driver-popover')).toHaveCount(0);
    await expect(page.locator('.driver-active-element')).toHaveCount(0);
    await expect(page.locator('.header-profile-trigger')).toHaveAttribute('aria-haspopup', 'true');
  });
}

test('la guía de búsqueda deja la lupa diciendo la verdad: buscador abierto, aria-expanded="true"', async ({ page }) => {
  await abrirGuia(page, GUIAS[0].titulo);

  await page.locator('header button[aria-label$="búsqueda global"]').click();
  for (let i = 0; i < 4; i++) await page.locator('.driver-popover-next-btn').click();

  await expect(page.locator('.driver-popover')).toHaveCount(0);
  await expect(page.locator('#buscador-global input')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar búsqueda global' })).toHaveAttribute('aria-expanded', 'true');
});

test('Esc cierra la guía en cualquier paso y no deja nada encima', async ({ page }) => {
  await abrirGuia(page, GUIAS[1].titulo);
  // Paso 1 → 2; el 2 espera el clic en "Reportes": "Siguiente" está deshabilitado y se pulsa el elemento.
  await page.locator('.driver-popover-next-btn').click();
  await expect(page.locator('.driver-popover-next-btn')).toBeDisabled();
  await page.locator('.driver-active-element').click();
  await expect(page.locator('.driver-popover-title')).toContainText('explorador');

  await page.keyboard.press('Escape');

  await expect(page.locator('.driver-overlay, .driver-popover')).toHaveCount(0);
  await expect(page.locator('.driver-active-element')).toHaveCount(0);
});
