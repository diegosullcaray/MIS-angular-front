import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/** Resultado combinado de "Captaciones" (`CaptacionesService.obtenerCaptaciones`) — 3 bloques del legado (`rda/sectorista/captaciones/captacion_sec_01/_02/_03`). */
export interface ReporteCaptaciones {
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
  tabla3: TablaReporteResultado;
}
