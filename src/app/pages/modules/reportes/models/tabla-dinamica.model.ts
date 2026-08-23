/** Columna dinámica del motor `table.regular` (`resultado.headers`, JSON string en el backend). */
export interface ColumnaDinamica {
  key: string;
  label: string;
  style?: Record<string, string>;
  /** Formato de la celda — lo declaran tanto el payload como los `tblHeaders` estáticos del legado (`{ type: 'integer' }`). */
  format?: { type?: string };
  subs?: ColumnaDinamica[];
}

/** Tarjeta KPI de `resultado.meta1` — legado `carterizacion-cap-com.component.ts` (`kpiCards`). */
export interface KpiTablaDinamica {
  /** Nombre del producto (`AHORROS`, `PLAZO FIJO`, `CTS`). */
  producto: string;
  /** Saldo total del producto (`HSBSDO1`). */
  saldo: number;
  /** Variación del mes, tomada de la fila total de la tabla. */
  variacion: number;
}

export interface TablaDinamicaResultado {
  columnas: ColumnaDinamica[];
  filas: Record<string, unknown>[];
  /** Solo lo traen los reportes que declaran `meta1` (ej. `RS_MON_SALCAP_COM_01`). */
  kpis?: KpiTablaDinamica[];
}

/** Estado inicial de una tabla dinámica aún sin cargar. */
export const TABLA_DINAMICA_VACIA: TablaDinamicaResultado = { columnas: [], filas: [] };

/** Forma cruda de `resultado` del motor `table.regular` (`ModReportesService.getRegularTableResult`). */
export interface TablaRegularResultadoRaw {
  data?: unknown[];
  headers?: string;
  /** Tarjetas KPI: JSON string o array ya parseado, según el reporte. */
  meta1?: string | Record<string, unknown>[];
}

export interface TablaRegularResponseBody {
  resultado?: TablaRegularResultadoRaw;
}
