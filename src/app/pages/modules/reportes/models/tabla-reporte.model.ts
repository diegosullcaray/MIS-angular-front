export interface FilaEncabezadoColumna {
  columnDef: string;
  header: string;
  cols?: number;
  rows?: number;
  isdata?: number;
  format?: Record<string, unknown>;
  style?: Record<string, string>;
}

export type ColumnaReporte = FilaEncabezadoColumna;

export interface FilaEncabezadoReporte {
  columns: FilaEncabezadoColumna[];
}

export type FilaReporte = Record<string, unknown>;

/** Resultado de un bloque del motor de reportes "mixtos" (tabla multi-encabezado o tarjeta KPI, según `cod_rep`). */
export interface TablaReporteResultado {
  headers: FilaEncabezadoReporte[];
  body: FilaReporte[];
  additional: Record<string, unknown>;
}
