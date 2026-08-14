import type { TablaReporteResultado } from '../tabla-reporte.model';

/** Resultado combinado de "Control de Cargas" (`ControlCargasService.obtenerReporte`). */
export interface ReporteControlCargas {
  produccion: TablaReporteResultado;
  procesos: TablaReporteResultado;
}
