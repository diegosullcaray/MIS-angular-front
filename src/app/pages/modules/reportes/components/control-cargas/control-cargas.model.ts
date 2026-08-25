import type { TablaReporteResultado } from '../../models/tabla-reporte.model';

/** Resultado combinado de "Control de Cargas" (`ControlCargasService.obtenerReporte`). */
export interface ReporteControlCargas {
  produccion: TablaReporteResultado;
  procesos: TablaReporteResultado;
}
