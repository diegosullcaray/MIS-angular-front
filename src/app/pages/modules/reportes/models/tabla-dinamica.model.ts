/**
 * Columna dinámica del motor `table.regular` (`resultado.headers`, JSON string
 * en el backend). `subs` es opcional — cubre el caso de encabezados anidados
 * multi-fila que el `stg-table2` legado soporta; si el backend nunca los usa,
 * la columna se trata como hoja de un único nivel.
 */
export interface ColumnaDinamica {
  key: string;
  label: string;
  style?: Record<string, string>;
  subs?: ColumnaDinamica[];
}

export interface TablaDinamicaResultado {
  columnas: ColumnaDinamica[];
  filas: Record<string, unknown>[];
}

/** Forma cruda de `resultado` del motor `table.regular` (`ModReportesService.getRegularTableResult`). */
export interface TablaRegularResultadoRaw {
  data?: unknown[];
  headers?: string;
}

export interface TablaRegularResponseBody {
  resultado?: TablaRegularResultadoRaw;
}
