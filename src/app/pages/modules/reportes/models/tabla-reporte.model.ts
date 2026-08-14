export interface FilaEncabezadoColumna {
  columnDef: string;
  header: string;
  cols?: number;
  rows?: number;
  isdata?: number;
  /** Oculta el `<th>` de esta columna (no reserva espacio en la grilla de encabezado), sin afectar su dato en el cuerpo — igual que la clase `hidden` del legado (`table-multiheader.component.html`). Lo usan columnas cuyo dato queda "debajo" del colspan de otra (ej. `fecha_nombre` bajo el `cols: 2` de "Fecha"). */
  hidden?: boolean;
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
