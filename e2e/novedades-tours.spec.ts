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
  { titulo: 'Navega por sistemas y sus paneles', pasos: 8, conClic: null },
  { titulo: 'Personaliza tu espacio de trabajo', pasos: 6, conClic: /Abre tu perfil|Entra a Configuración/ },
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

    const titulos: string[] = [];
    for (let i = 0; i < guia.pasos; i++) {
      const titulo = page.locator('.driver-popover-title');
      await expect(titulo).toHaveText(/Paso \d/);
      const texto = await titulo.innerText();
      titulos.push(texto);

      // Sin esperar a que termine la animación.
      if (guia.conClic?.test(texto)) await page.locator('.driver-active-element').last().click();
      else await page.locator('.driver-popover-next-btn').click();

      // Cada clic avanza (o cierra en el último): nunca se queda en el mismo paso.
      if (i === guia.pasos - 1) await expect(page.locator('.driver-popover')).toHaveCount(0, { timeout: 3_000 });
      else await expect(page.locator('.driver-popover-title')).not.toHaveText(texto, { timeout: 3_000 });
    }

    expect(titulos.map((t) => Number(/Paso (\d)/.exec(t)?.[1]))).toEqual(
      Array.from({ length: guia.pasos }, (_, i) => i + 1),
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
  await page.locator('.driver-popover-next-btn').click();
  await page.locator('.driver-popover-next-btn').click();

  await page.keyboard.press('Escape');

  await expect(page.locator('.driver-overlay, .driver-popover')).toHaveCount(0);
  await expect(page.locator('.driver-active-element')).toHaveCount(0);
});
