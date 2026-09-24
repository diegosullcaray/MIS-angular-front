import type { Page } from '@playwright/test';

/**
 * Backend Ant simulado que responde a CUALQUIER reporte con una tabla ancha.
 *
 * Sirve para probar layout, no cifras: 10 columnas con encabezados largos y 12
 * filas son el caso que en un teléfono rompe una tabla (columnas aplastadas,
 * encabezados cortados, página empujada a lo ancho). Cada motor recibe la forma
 * que espera su mapeador:
 *
 * - `regularData` / `reportData` → `result` con `headers[].columns` y `body`.
 * - `table.regular` → `resultado` con `headers` serializado y `data`.
 * - `graphicData` → `result` vacío (los gráficos no son tablas).
 * - jerarquía (`base_hier`/`level_hier`) → la raíz Financiera, para que el
 *   selector emita un nodo y el reporte consulte.
 * - `sec_list2` → un asesor, para los reportes de analista.
 */
export const COLUMNAS_ANCHAS = [
  'Descripción de la unidad',
  'Saldo de cartera vigente',
  'Saldo vencido del periodo',
  'Clientes activos',
  'Operaciones desembolsadas',
  'Monto desembolsado',
  'Cumplimiento de la meta',
  'Variación mensual',
  'Mora mayor a 30 días',
  'Tasa promedio ponderada',
] as const;

const claves = COLUMNAS_ANCHAS.map((_, i) => `col_${i + 1}`);

const filas = Array.from({ length: 12 }, (_, f) =>
  Object.fromEntries(claves.map((clave, i) => [clave, i === 0 ? `ZONA DE PRUEBA NÚMERO ${f + 1}` : 1_234_567.89 + f * 1000 + i])),
);

/** Motor "mixto": una fila de encabezado, cada columna es hoja (`isdata`). */
const resultMixto = {
  headers: [
    {
      columns: COLUMNAS_ANCHAS.map((header, i) => ({
        columnDef: claves[i],
        header,
        isdata: i + 1,
        format: { type: i === 0 ? 'text' : 'number' },
      })),
    },
  ],
  body: filas,
  additional: {},
};

/** Motor `table.regular`: encabezados serializados, como los manda Ant. */
const resultadoRegular = {
  headers: JSON.stringify(COLUMNAS_ANCHAS.map((label, i) => ({ key: claves[i], label }))),
  data: filas,
};

const RAIZ = { tip_cod: 1, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 1, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];

export async function mockearReportesConDatos(page: Page): Promise<void> {
  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};

    if (strands.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (strands.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (strands.includes('sec_list2')) body = { result_sectorista: [{ nombre_sec: 'ASESOR DE PRUEBA', num_doc: '12345678' }] };
    else if (strands.includes('graphicData')) body = { result: [] };
    else if (strands.includes('table.regular')) body = { resultado: resultadoRegular };
    else if (strands.includes('regularData') || strands.includes('reportData')) body = { result: resultMixto };

    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });
}
