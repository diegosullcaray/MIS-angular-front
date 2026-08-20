/** Columna dinámica del motor `table.regular` (`resultado.headers`, JSON string en el backend). */
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

/** Estado inicial de una tabla dinámica aún sin cargar. */
export const TABLA_DINAMICA_VACIA: TablaDinamicaResultado = { columnas: [], filas: [] };

/** Forma cruda de `resultado` del motor `table.regular` (`ModReportesService.getRegularTableResult`). */
export interface TablaRegularResultadoRaw {
  data?: unknown[];
  headers?: string;
}

export interface TablaRegularResponseBody {
  resultado?: TablaRegularResultadoRaw;
}
