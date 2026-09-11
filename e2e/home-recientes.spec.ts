import { test, expect } from '@playwright/test';
import {
  PREFERENCIAS_STORAGE_KEY,
  inyectarPreferencias,
  inyectarSesionSinPreferencias,
  inyectarSesionVigente,
  mockearBackendAnt,
} from './fixtures/session';

const HORA = 60 * 60 * 1000;

/**
 * Home (`/app/dashboard`): sin saludo y con los últimos reportes abiertos.
 *
 * El historial vive en `localStorage` bajo las preferencias, así que el spec lo
 * siembra ahí — igual que si el usuario hubiera navegado antes.
 */
test.describe('Home · reportes recientes', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('no muestra el saludo de bienvenida', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.getByRole('heading', { name: 'Reportes recientes' })).toBeVisible();

    await expect(page.locator('body')).not.toContainText('¡Hola');
  });

  test('invita a abrir un reporte en el primer ingreso', async ({ page }) => {
    await page.goto('/app/dashboard');

    await expect(page.getByText('Todavía no abriste ningún reporte')).toBeVisible();
    await expect(page.locator('a.reciente-fila')).toHaveCount(0);
  });

  test('lista los recientes sembrados y navega al hacer clic', async ({ page }) => {
    await inyectarPreferencias(page, {
      anuncios: { vistos: [], silenciar: true },
      bienvenida: { vista: true },
      recientes: [
        {
          ruta: '/app/actividades/dest-credito',
          titulo: 'Destino de Crédito',
          categoria: 'Actividades',
          fechaVisita: Date.now() - 2 * HORA,
        },
      ],
    });

    await page.goto('/app/dashboard');

    const tarjeta = page.locator('a.reciente-fila');
    await expect(tarjeta).toHaveCount(1);
    await expect(tarjeta).toContainText('Destino de Crédito');
    await expect(tarjeta).toContainText('Hace 2 h');

    await tarjeta.click();
    await expect(page).toHaveURL(/\/app\/actividades\/dest-credito$/);
  });

  test('la lista de recientes no desborda a lo ancho', async ({ page }) => {
    await inyectarPreferencias(page, {
      anuncios: { vistos: [], silenciar: true },
      bienvenida: { vista: true },
      recientes: Array.from({ length: 6 }, (_, i) => ({
        ruta: `/app/actividades/reporte-${i}`,
        titulo: `Reporte de nombre bastante largo número ${i}`,
        categoria: 'Actividad diaria',
        fechaVisita: Date.now() - i * HORA,
      })),
    });

    await page.goto('/app/dashboard');
    await expect(page.locator('a.reciente-fila')).toHaveCount(6);

    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(desborde).toBeLessThanOrEqual(1);
  });
});

/**
 * La captura por router se prueba aparte: este bloque NO siembra preferencias,
 * porque el sembrado corre en cada carga de página y borraría justamente lo que
 * la navegación acaba de anotar.
 */
test.describe('Home · captura del reporte visitado', () => {
  test('anota en preferencias el reporte que se abre', async ({ page }) => {
    await inyectarSesionSinPreferencias(page);
    await mockearBackendAnt(page);

    await page.goto('/app/actividades/dest-credito');

    await expect
      .poll(async () =>
        page.evaluate(
          (clave) => JSON.parse(localStorage.getItem(clave) ?? '{}').recientes ?? [],
          PREFERENCIAS_STORAGE_KEY
        )
      )
      .toEqual([expect.objectContaining({ ruta: '/app/actividades/dest-credito', titulo: 'Destino de Crédito' })]);
  });
});
