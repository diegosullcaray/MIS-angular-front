import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/** Filtros reales del legado (`Tramo01()`, `Producto01()`, `Boolean01()` x3, `TramoVenc01()`), compartidos con el portafolio reasignado. */
export {
  OPCIONES_TRAMO,
  OPCIONES_PRODUCTO_EFECTIVIDADES as OPCIONES_PRODUCTO,
  OPCIONES_SI_NO,
  OPCIONES_TRAMO_DIAS_GESTION,
} from '../../../models/filtros.model';

/** Resultado de "Detalle Monitor de Efectividades Asesor" (`MonitorEfectividadesService.obtenerMonitorEfectividades`) — único bloque del legado (`RS_MON_EFEC_SEC_01`), "Expresado en PEN y %" (`content.higher` del legado). */
export interface ReporteMonitorEfectividades {
  tabla1: TablaReporteResultado;
}

/** Estado de los 6 filtros del reporte — variables originales del legado (`tramof`/`prod`/`comp_r`/`zcuo`/`ucuo`/`tdcr`). */
export interface FiltrosMonitorEfectividades {
  tramof: string;
  prod: string;
  comp_r: string;
  zcuo: string;
  ucuo: string;
  tdcr: string;
}

export const FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO: FiltrosMonitorEfectividades = {
  tramof: 'TODO',
  prod: 'TODO',
  comp_r: 'TODO',
  zcuo: 'TODO',
  ucuo: 'TODO',
  tdcr: 'TODO',
};
