import type { TablaReporteResultado } from '../tabla-reporte.model';

/** Resultado combinado de "Colocaciones diaria Operación, Monto y Recuperación" (`ColocacionesDiariaService.obtenerColocacionesDiaria`) — 3 bloques del legado (`PROYEC_DIACOLREC_AS_01/_02/_03`). */
export interface ReporteColocacionesDiaria {
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
  tabla3: TablaReporteResultado;
}
