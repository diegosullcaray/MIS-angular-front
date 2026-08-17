import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/** Resultado de "Resumen de Movilidad" (`ResumenMovilidadService.obtenerResumenMovilidad`) — único bloque del legado (`RESNMOV_02` — el `id` real es `_02`, no `_01`). */
export interface ReporteResumenMovilidad {
  tabla1: TablaReporteResultado;
}
