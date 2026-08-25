import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';

/** Reporte de un solo bloque — la forma de casi todos los de Captaciones. */
export interface ReporteBloqueUnico {
  tabla1: TablaReporteResultado;
}

/** Reporte de dos bloques ("Gestión de Tasas Pasivas", "Panel Operaciones"). */
export interface ReporteDosBloques {
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
}
