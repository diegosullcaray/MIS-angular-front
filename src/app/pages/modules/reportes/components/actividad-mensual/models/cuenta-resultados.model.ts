import type { OpcionFiltro } from '../../../../../../shared/ui/formularios/opcion-filtro.model';

/** Fila de `TAB_CUE_RES_01`. `style` es el nivel: 1 detalle, 2 principal, 3 resultado, 4 y 5 sub-detalle. */
export type CuentaResultadoFila = {
  style: number;
  cuenta_codigo: string;
  cuenta_nombre: string;
  orden: number;
  periodo_anio_anterior: number;
  periodo_anterior: number;
  periodo_actual: number;
  variacion_periodo_anterior: number;
  acumulado_anio_anterior: number;
  acumulado_actual: number;
  variacion_acumulado: number;
  variacion_acumulado_pct: number;
};

/** `resultado.headers`: los periodos del propio reporte. */
export interface MetadatosCuentaResultados {
  /** `1` cuando el periodo más reciente todavía no está cerrado. */
  preliminar: 0 | 1;
  /** `YYYY-MM-DD`, el más reciente primero. */
  fechas: string[];
}

export interface CuentaResultadosResultado {
  periodos: OpcionFiltro[];
  /** Periodo de las cifras (`YYYY-MM-DD`). */
  fecha: string;
  preliminar: boolean;
  filas: CuentaResultadoFila[];
}
