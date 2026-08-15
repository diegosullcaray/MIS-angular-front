import type { TablaReporteResultado } from '../tabla-reporte.model';

/** Resultado de "Seguros" (`SegurosService.obtenerSeguros`) — único bloque del legado (`rda/sectorista/seguros/seguros_sec_01`), "Expresado en PEN y %" (`content.higher` del legado, `crs-map.ts`). */
export interface ReporteSeguros {
  tabla1: TablaReporteResultado;
}
