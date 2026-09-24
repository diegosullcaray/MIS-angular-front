import type { ColumnaDinamica } from '../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../../shared/ui/formularios/opcion-filtro.model';

/**
 * Fila de `TAB_CUE_RES_01` — legado `cuenta-resultados.util.ts` (`CuentaResultadoRow`).
 *
 * `style` es el nivel de la cuenta: 1 detalle, 2 principal, 3 resultado. El
 * legado también sangra 4 y 5 aunque su tipo no los declare. Es `type` y no
 * `interface` para que la acepte `app-tabla-dinamica` (`Record<string, unknown>`).
 */
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

/** `resultado.headers` de `TAB_CUE_RES_01`: no son columnas, son los periodos del propio reporte. */
export interface MetadatosCuentaResultados {
  /** `1` cuando el periodo más reciente todavía no está cerrado. */
  preliminar: 0 | 1;
  /** Periodos disponibles (`YYYY-MM-DD`), el más reciente primero. */
  fechas: string[];
}

/** Resultado ya mapeado de una consulta. */
export interface CuentaResultadosResultado {
  /** Opciones del filtro de periodo, en el orden del backend. */
  periodos: OpcionFiltro[];
  /** Periodo al que corresponden las cifras (`YYYY-MM-DD`). */
  fecha: string;
  preliminar: boolean;
  columnas: ColumnaDinamica[];
  filas: CuentaResultadoFila[];
}
