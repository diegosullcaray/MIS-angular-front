import type { FilaEncabezadoReporte, FilaReporte } from '../../../../shared/ui/tablas/models/tabla-reporte.model';

// El contrato de render (columnas, encabezados, filas) vive junto a `<app-tabla-reporte>`;
// acá queda el sobre que devuelve el motor de reportes, que es de este módulo.
export type { ColumnaReporte, FilaEncabezadoColumna, FilaEncabezadoReporte, FilaReporte } from '../../../../shared/ui/tablas/models/tabla-reporte.model';

/** Resultado de un bloque del motor de reportes "mixtos" (tabla multi-encabezado o tarjeta KPI, según `cod_rep`). */
export interface TablaReporteResultado {
  headers: FilaEncabezadoReporte[];
  body: FilaReporte[];
  additional: Record<string, unknown>;
}

/** Estado inicial de un bloque aún sin cargar. */
export const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };
