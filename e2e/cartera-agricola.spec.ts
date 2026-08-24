import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';

const RAIZ = { tip_cod: 9, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 9, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];

/** Los bloques de gráfico traen su `{categories, series}` serializado en `headers`. */
const GRAFICO = JSON.stringify({ categories: ['ARROZ', 'CAFE'], series: [{ name: 'Saldo', data: [500, 300] }] });

/** `resultado.data` de esos mismos bloques: las filas de clientes que alimentan el modal. */
const CLIENTES = [
  { HDESCUL: 'ARROZ', HDESCLI: 'PEREZ JUAN', HETPROD: 'VIGENTE', HCTACLI: '001', HCAPMON: 400, HVENMON: 40, HEXTENS: 3 },
  { HDESCUL: 'ARROZ', HDESCLI: 'GOMEZ ANA', HETPROD: 'VIGENTE', HCTACLI: '002', HCAPMON: 100, HVENMON: 10, HEXTENS: 2 },
  { HDESCUL: 'CAFE', HDESCLI: 'OTRO CLIENTE', HETPROD: 'VIGENTE', HCTACLI: '003', HCAPMON: 300, HVENMON: 0, HEXTENS: 9 },
];

async function mockBackend(page: Page) {
  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};

    if (strands.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (strands.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (strands.includes('RS_AGROMIX_01')) {
      body = {
        resultado: {
          headers: JSON.stringify([
            { key: 'DESCRIPCION', label: 'Unidad' },
            { key: 'HSALCAPMN', label: 'Saldo', format: { type: 'integer' } },
          ]),
          data: [{ DESCRIPCION: 'ZONA NORTE', htipcod: 13, cod_rel: 'ZN', HSALCAPMN: 1000, HSALVEMN: 50, HCCLI: 20, EXTE: 15 }],
          meta1: [{ HSALCAPMN: 900, HSALVEMN: 60, HCCLI: 18, EXTE: 14 }],
        },
      };
    } else if (strands.includes('RS_AGROMIX_')) body = { resultado: { headers: GRAFICO, data: CLIENTES } };
    else body = { result: { headers: [], body: [], additional: {} } };

    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });
}

/** Clic en la primera barra de una gráfica, asegurando que quede a la vista. */
async function clicEnPrimeraBarra(page: Page, indiceGrafico: number) {
  const barra = page
    .locator('app-grafico-apex')
    .nth(indiceGrafico)
    .locator('.apexcharts-bar-area, .apexcharts-series path')
    .first();
  await barra.scrollIntoViewIfNeeded();
  await barra.click({ force: true });
}

/** Deja la pantalla en la vista de gráficos de "ZONA NORTE". */
async function abrirDetalleDeNivel(page: Page) {
  await inyectarSesionVigente(page);
  await mockBackend(page);
  await page.goto('/app/reportes/repositorio/actividad-diaria/cartera/agro-mix');
  await page.waitForLoadState('networkidle');
  await page.getByText('ZONA NORTE').first().click();
  await expect(page.getByRole('heading', { name: /Detalle por cultivo/ })).toBeVisible();
}

test.describe('Cartera Agrícola — detalle por cultivo', () => {
  test('al elegir una fila baja a los cuatro gráficos del legado', async ({ page }) => {
    await abrirDetalleDeNivel(page);

    // Mismos cuatro bloques y títulos que `agro-mix-d.component.html`.
    for (const titulo of [
      'Distribución Saldo por Cultivo',
      'Distribución Saldo Vencido por Cultivo',
      'Distribución de Clientes por Cultivo',
      'Resumen General',
    ]) {
      await expect(page.getByText(titulo, { exact: true })).toBeVisible();
    }
  });

  test('el clic en una barra abre el listado de clientes de ese cultivo, con sus cuatro totales', async ({ page, isMobile }) => {
    // El comportamiento no depende del viewport, pero en un dispositivo táctil el
    // clic sobre el SVG de ApexCharts no se resuelve de forma estable; alcanza
    // con verificarlo en escritorio.
    test.skip(!!isMobile, 'El hit-testing sobre el SVG no es fiable con eventos táctiles.');

    await abrirDetalleDeNivel(page);

    await clicEnPrimeraBarra(page, 0);

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Solo las filas de ARROZ (2 de las 3), y los totales sumados sobre ellas.
    await expect(modal.getByText('PEREZ JUAN')).toBeVisible();
    await expect(modal.getByText('GOMEZ ANA')).toBeVisible();
    await expect(modal.getByText('OTRO CLIENTE')).toHaveCount(0);

    await expect(modal.getByText('S/ 500', { exact: true })).toBeVisible(); // saldo cartera: 400 + 100
    await expect(modal.getByText('S/ 50', { exact: true })).toBeVisible(); // saldo vencido: 40 + 10
    await expect(modal.getByText('10%', { exact: true })).toBeVisible(); // 50 / 500
  });
});
