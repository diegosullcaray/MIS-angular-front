import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/** Tarjeta KPI del bloque `_01` (`additional`, "Monitor de Desembolsos" de analista/sectorista). */
export interface KpiOperacionesDesembolsadas {
  fecha?: string;
  hora?: string;
  cumpl_des_acum?: string;
  style_cumpl_des_acum?: string;
}

/** Tarjeta KPI del bloque `_02` (`additional`, "Monitor de Desembolsos" de analista/sectorista). */
export interface KpiMontoDesembolsado {
  cumpl_ope_acum?: string;
  style_cumpl_ope_acum?: string;
}

/** Resultado combinado de "Monitor de Desembolsos" (`MonitorMetasDesembolsoService.obtenerMonitorMetasDesembolso`) — 3 bloques del legado (`rda/sectorista/monitor_metas_desembolsos/monitor_metas_desem_sec_01/_02/_03`). */
export interface ReporteMonitorMetasDesembolso {
  kpiOperaciones: KpiOperacionesDesembolsadas | null;
  kpiMonto: KpiMontoDesembolsado | null;
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
  tabla3: TablaReporteResultado;
}
