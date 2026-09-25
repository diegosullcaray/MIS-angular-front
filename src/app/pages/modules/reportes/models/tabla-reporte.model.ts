import type { FilaEncabezadoReporte, FilaReporte } from '../../../../shared/ui/tablas/models/tabla-reporte.model';

export type { ColumnaReporte, FilaEncabezadoColumna, FilaEncabezadoReporte, FilaReporte } from '../../../../shared/ui/tablas/models/tabla-reporte.model';

/** Resultado de un bloque del motor de reportes "mixtos" (tabla multi-encabezado o tarjeta KPI, según `cod_rep`). */
export interface TablaReporteResultado {
  headers: FilaEncabezadoReporte[];
  body: FilaReporte[];
  additional: Record<string, unknown>;
}

/** Contrato estándar para reportes de un solo bloque (ReporteSimpleBase). */
export interface ReporteBloqueUnico {
  tabla1: TablaReporteResultado;
}

/** Contrato estándar para reportes de dos bloques. */
export interface ReporteDosBloques {
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
}

/** Estado inicial de un bloque aún sin cargar. */
export const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * Bloque que todavía no respondió (carga independiente, ver `BloqueReporteService.regulares`).
 * Es una tabla vacía —quien la procese no se rompe— pero se distingue por identidad: la tabla
 * que la recibe muestra su esqueleto en vez de "Sin datos".
 */
export const TABLA_PENDIENTE: TablaReporteResultado = { headers: [], body: [], additional: {} };

