import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/** Tarjeta KPI de `Monitor_Dese_01` (`additional` del bloque, "Monitor Metas Desembolso"). */
export interface KpiOperacionesDesembolsadas {
  fecha?: string;
  hora?: string;
  cumpl_des_acum?: string;
  style_cumpl_des_acum?: string;
}

/** Tarjeta KPI de `Monitor_Dese_02` (`additional` del bloque, "Monitor Metas Desembolso"). */
export interface KpiMontoDesembolsado {
  cumpl_ope_acum?: string;
  style_cumpl_ope_acum?: string;
}

/** Opción del filtro "Tipo" de "Monitor Reprogramados" (`RS_MON_REP_01`, variable `car`). */
export interface OpcionTipoMonRep {
  id: 1 | 2;
  desc: string;
}

export const OPCIONES_TIPO_MON_REP: OpcionTipoMonRep[] = [
  { id: 1, desc: 'Operaciones' },
  { id: 2, desc: 'Saldo' },
];

/** Resultado combinado de "Monitor Metas Desembolso" (`AvanceComercialService.obtenerMonitorMetasDesembolso`). */
export interface ReporteMonitorMetasDesembolso {
  kpiOperaciones: KpiOperacionesDesembolsadas | null;
  kpiMonto: KpiMontoDesembolsado | null;
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
  tabla3: TablaReporteResultado;
  tabla4: TablaReporteResultado;
}
