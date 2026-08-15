import type { TablaReporteResultado } from '../tabla-reporte.model';

/** Resultado combinado de "Reporte de Autonomía de Tasas" (`AutonomiaTasasService.obtenerAutonomiaTasas`) — 4 bloques del legado (`rda/sectorista/Reporte_Autonomia_Tasas/reporte_autonomia_tasa_sec_01/_02/_03/_04`), cada uno con un `var` fijo distinto (`crs-map.ts`). */
export interface ReporteAutonomiaTasas {
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
  tabla3: TablaReporteResultado;
  tabla4: TablaReporteResultado;
}
