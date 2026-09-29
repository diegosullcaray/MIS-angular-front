import { test, expect, type Page } from '@playwright/test';
import { QUINCE_MINUTOS_MS, SESSION_STORAGE_KEY, USUARIO_DE_PRUEBA, inyectarSesionVigente } from './fixtures/session';

/**
 * Tablero del panel del asesor (maqueta de gobierno `panel unificado
 * asesor`): las cifras de tarjetas, focos e indicadores salen de las tablas de los 7 reportes,
 * leídas por el nombre de su fila. Aquí el backend responde con esas tablas.
 */

type Celda = string | number | null;
function tabla(encabezados: string[], filas: Celda[][], formatos: (string | null)[] = []) {
  const columns = encabezados.map((h, i) => ({ columnDef: `c${i}`, header: h, isdata: i + 1, ...(formatos[i] ? { format: { type: formatos[i] } } : {}) }));
  return { headers: [{ columns }], body: filas.map((f) => Object.fromEntries(f.map((v, i) => [`c${i}`, v]))), additional: {} };
}
const N = 'number';
const CARTERA_01 = tabla(['Variable', 'Presupuesto', 'Ejecutado'], [
  ['Variación de cartera', '—', -274224], ['Ratio de efectividad tramo −30 a 0 días', '—', '95.94%'], ['Ratio de efectividad tramo 1 a 30 días', '—', '0.00%'],
  ['Ratio de mora real', '—', '2.20%'], ['Ratio de mora > 1 día', '—', '5.12%'],
], [null, null, N]);
const CARTERA_02 = tabla(['Variable', 'Cierre mes ant.', 'Ejecutado', 'Variación'], [
  ['Stock de cartera', 3528967, 3254743, -274224], ['Stock de clientes', 142, 143, 1], ['TAPP stock', '23.09%', '23.32%', '23 pbs'], ['TAPP mes', '27.82%', '48.63%', '2,081 pbs'],
  ['Número de clientes en mora', 1, 5, 4], ['Clientes en mora tramo 1 a 30 días', 1, 4, 3], ['Saldo en mora tramo 1 a 30 días', 71499, 95197, 23698], ['Saldo medio de cartera', 3446945, 1775379, -1671566],
], [null, N, N, N]);
const CLI_NR = tabla(['Variable', 'Cierre mes ant.', 'A hoy', 'Variación'], [
  ['Número de clientes nuevos', 2, 2, 0], ['Número de clientes recurrentes', 20, 6, -14], ['Ticket promedio de clientes desembolsados', 16668, 3538, -13131],
], [null, N, N, N]);
const CLI_P1 = tabla(['Producto', 'Cierre mes ant.', 'A hoy', 'Variación'], [
  ['Agropecuario', 26, 24, -2], ['Construyendo Confianza', 1, 2, 1], ['Emprendiendo Confianza', 126, 121, -5], ['Impulsa MyPerú', 8, 8, 0], ['Crédito Educativo', 4, 4, 0], ['Total', 166, 160, -6],
], [null, N, N, N]);
const MON_01 = tabla(['Día', 'Ops', 'Meta', '% cumpl.', 'Ops acum.', 'Meta acum.', '% acum.', '% días'], [
  ['1 · Mar 01/09', 0, 1, '0.00%', 0, 15, '0.00%', '3.85%'], ['2 · Mié 02/09', 1, 1, '100.00%', 8, 15, '53.33%', '96.15%'],
], [null, N, N, null, N, N, null, null]);
const TASAS_01 = tabla(['Rubro', 'Encima mín.', 'A la mín.', 'Administr.', 'Total'], [
  ['Nro. operaciones', 0, 0, 5, 5], ['Nro. operaciones (%)', '0.00%', '0.00%', '100.00%', '100.00%'], ['Monto desembolsado', 0, 0, 14800, 14800],
  ['Ticket promedio (PEN)', 0, 0, 2960, 2960], ['TAPP mes (%)', '0.00%', '0.00%', '52.98%', '52.98%'], ['TAPP mínima referencial (%)', '0.00%', '0.00%', '55.76%', '55.76%'], ['Distancia (pbs)', 0, 0, -277, -277],
], [null, N, N, N, N]);
const SEG = tabla(['Variable', 'Cierre anterior', 'Ejecutado', 'Variación'], [
  ['Multiriesgo (nro. pólizas mes)', 5, 0, -5], ['Multiriesgo (nro. pólizas stock)', 28, 26, -2], ['Mult. crédito y protec. cuota (pólizas stock)', 1, 1, 0], ['Seguros agropecuarios (pólizas stock)', null, null, null],
], [null, N, N, N]);
const PREV = tabla(['Cliente', 'Cuenta', 'Saldo capital', 'Ingreso a mora'], [
  ['Torres Rojas Simon', '332689', 82524, '2026-10-02'], ['Maquera Carrillo Nancy', '3375444', 74845, '2026-10-02'], ['Choque Aquino Edwin', '5055329', 64162, '2026-10-02'],
], [null, null, N, null]);
const EFEC = tabla(['Cliente', 'Saldo', 'Tramo inicio', 'Días'], [['Vilca Alberto Santria', 71498.75, '1 a 30', 45]], [null, N, null, N]);
const VACIA = tabla(['Grupo'], []);

function respuesta(strands: string): unknown {
  const r = (t: unknown) => ({ result: t });
  if (strands.includes('cartera_sec_01')) return r(CARTERA_01);
  if (strands.includes('cartera_sec_02')) return r(CARTERA_02);
  if (strands.includes('cliente_nuevo_rec')) return r(CLI_NR);
  if (strands.includes('cliente_producto_sec_01')) return r(CLI_P1);
  if (strands.includes('cliente_producto')) return r(VACIA);
  if (strands.includes('monitor_metas_desem_sec_01')) return r({ ...MON_01, additional: { fecha: '29/09/2026', cumpl_des_acum: '53.33%' } });
  if (strands.includes('monitor_metas_desem_sec_02')) return r({ ...MON_01, additional: { cumpl_ope_acum: '6.51%' } });
  if (strands.includes('monitor_metas_desem_sec_03')) return r(VACIA);
  if (strands.includes('reporte_autonomia_tasa_sec_01')) return r(TASAS_01);
  if (strands.includes('reporte_autonomia_tasa')) return r(VACIA);
  if (strands.includes('seguros_sec')) return r(SEG);
  if (strands.includes('recuperacion_preventiva')) return r(PREV);
  if (strands.includes('RS_MON_EFEC_SEC')) return r(EFEC);
  if (strands.includes('grupo_pdm')) return r(VACIA);
  return {};
}

async function preparar(page: Page, ancho: number, alto: number) {
  await page.setViewportSize({ width: ancho, height: alto });
  await inyectarSesionVigente(page);
  await page.addInitScript(({ key, usuario, expiraEn }) => {
    window.sessionStorage.setItem(key, JSON.stringify({ token: 't', usuario, expiraEn }));
  }, { key: SESSION_STORAGE_KEY, usuario: { ...USUARIO_DE_PRUEBA, nombre: 'Yactayo Luque Magali Mariet', tipoUsuario: 1, numDoc: '12345678' }, expiraEn: Date.now() + QUINCE_MINUTOS_MS });
  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body: respuesta(strands) }) });
  });
  await page.goto('/app/analista/panel-unificado');
  await expect(page.locator('.tarjeta .pie').first()).toBeVisible();
}


test.describe('Panel del asesor · tablero', () => {
  test('tarjetas y focos con las cifras de las tablas; sin los 4 KPI titulares', async ({ page }) => {
    await preparar(page, 1440, 1000);
    // Sin título ni subtítulos: ni "Impacto del mes" ni el asesor con la fecha de corte.
    await expect(page.getByText('Impacto del mes')).toHaveCount(0);
    await expect(page.getByText('Corte al')).toHaveCount(0);
    await expect(page.locator('[aria-label="Indicadores titulares"]')).toHaveCount(0);

    await expect(page.locator('.tarjeta[aria-label="Cartera"]')).toContainText('3,254,743');
    await expect(page.locator('.tarjeta[aria-label="Autonomía de tasas"]')).toContainText('−277 pbs');
    await expect(page.locator('.tarjeta[aria-label="Seguros"]')).toContainText('pólizas Multiriesgo en el mes (5 el mes anterior)');
    await expect(page.locator('.focos')).toContainText('TAPP del mes 277 pbs por debajo de la mínima');
    await expect(page.locator('.focos')).toContainText('Recurrentes desembolsados bajan de 20 a 6');
  });

  test('un foco abre el detalle de su dominio, con pestañas para pasar a otro', async ({ page }) => {
    await preparar(page, 1440, 1000);
    await page.locator('.foco', { hasText: 'Tasas' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByRole('tab', { selected: true })).toHaveText('Tasas');
    await expect(dialogo.locator('.kpi-card')).toHaveCount(4);
    await expect(dialogo).toContainText('Resumen Gestión de Tasas');

    await dialogo.getByRole('tab', { name: 'Mora' }).click();
    await expect(dialogo.getByRole('tab', { selected: true })).toHaveText('Mora');
    await expect(dialogo.locator('.filtros-reporte p-select')).toHaveCount(6);
  });

  test('en el teléfono la pestaña del dominio abierto queda a la vista y con el foco', async ({ page }) => {
    await preparar(page, 390, 844);
    await page.locator('.tarjeta[aria-label="Seguros"] .tarjeta-cabecera').click();
    const activa = page.getByRole('tab', { name: 'Seguros' });
    await expect(activa).toBeFocused();
    await expect(activa).toBeInViewport({ ratio: 1 });
  });

  for (const [nombre, ancho, alto] of [['escritorio', 1440, 1000], ['teléfono', 390, 844]] as const) {
    test(`no desborda en ${nombre}, en claro ni oscuro`, async ({ page }) => {
      await preparar(page, ancho, alto);
      for (const oscuro of [false, true]) {
        await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), oscuro);
        const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(desborde).toBeLessThanOrEqual(1);
      }
    });
  }
});
