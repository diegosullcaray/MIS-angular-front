/** Tipo de dato de una columna, para decidir cómo formatear/editar su celda. */
export type TipoColumna = 'number' | 'percent' | 'text' | 'comp_f';

/** Definición de columna de tabla — soporta un nivel de agrupación (columnas con `hijos`). */
export interface ColumnaTabla {
  label: string;
  /** Ausente si la columna es solo un grupo visual (tiene `hijos`). */
  key?: string;
  tipo?: TipoColumna;
  hijos?: ColumnaTabla[];
}

/** Fila genérica de `EditableTableComponent` — cualquier objeto plano (`FilaLineaSimple`, `ResponsableFila`, `LogVerificacionFila`...). */
export type FilaTabla = Record<string, unknown>;

/** Evento de edición de una celda de `EditableTableComponent` — igual forma que `editCell(evt)` del legado. */
export interface CeldaEditadaEvent<T extends FilaTabla = FilaTabla> {
  fila: T;
  key: string;
  valor: unknown;
}
