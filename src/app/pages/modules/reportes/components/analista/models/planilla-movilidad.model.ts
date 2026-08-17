import type { TablaReporteResultado } from '../tabla-reporte.model';

/** Resultado combinado de "Planilla de Movilidad" (`PlanillaMovilidadService.obtenerPlanillaMovilidad`) — 4 bloques del legado (`PLANMOV_01/_02/_03/_04`), todos con el parámetro fijo `fec` (`fec_day_ult`, "ayer"). */
export interface ReportePlanillaMovilidad {
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
  tabla3: TablaReporteResultado;
  tabla4: TablaReporteResultado;
}
