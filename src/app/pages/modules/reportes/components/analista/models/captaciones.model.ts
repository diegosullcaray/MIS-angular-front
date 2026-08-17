import type { TablaReporteResultado } from '../tabla-reporte.model';

/** Resultado combinado de "Captaciones" (`CaptacionesService.obtenerCaptaciones`) — 3 bloques del legado (`rda/sectorista/captaciones/captacion_sec_01/_02/_03`). La tercera tabla corresponde a "Ahorro Programado" (`content.higher` del legado, `crs-map.ts`). */
export interface ReporteCaptaciones {
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
  tabla3: TablaReporteResultado;
}
