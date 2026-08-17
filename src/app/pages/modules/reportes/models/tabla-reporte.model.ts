export interface FilaEncabezadoColumna {
  columnDef: string;
  /** Ausente en columnas `hidden` sin etiqueta propia (ej. el semáforo oculto de "TMM") — el backend directamente no manda la clave. */
  header?: string;
  cols?: number;
  rows?: number;
  isdata?: number;
  /** Oculta el `<th>` de esta columna (no reserva espacio en la grilla de encabezado), sin afectar su dato en el cuerpo — igual que la clase `hidden` del legado (`table-multiheader.component.html`). Lo usan columnas cuyo dato queda "debajo" del colspan de otra (ej. `fecha_nombre` bajo el `cols: 2` de "Fecha"). */
  hidden?: boolean;
  format?: Record<string, unknown>;
  /**
   * Estilo **del encabezado** de la columna, no de sus celdas de datos — en el
   * legado (`table-multiheader.component.html`) solo lo consume el `<th>`
   * (`'background-color': c.style?.background`). El fondo de una celda del
   * cuerpo viene por fila, en `fila['background_' + columnDef]`.
   */
  style?: {
    background?: string;
    desktop?: { width?: string };
    [clave: string]: unknown;
  };
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
