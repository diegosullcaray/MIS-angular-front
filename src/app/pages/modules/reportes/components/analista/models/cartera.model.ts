import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/** Resultado combinado de "Cartera" (`CarteraService.obtenerCartera`) — 2 bloques del legado (`rda/sectorista/cartera/cartera_sec_01/_02`). */
export interface ReporteCartera {
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
}
