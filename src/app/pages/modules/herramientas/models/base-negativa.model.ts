/** Definición de columna dinámica devuelta por el backend (`r.headers` del legado). */
export interface TableHeaderDef {
  label: string;
  key: string;
  style?: Record<string, string>;
}

/** Fila del buscador de "Consulta Base Negativa" (columnas fijas, `RS_BASE_NEG_01`). */
export interface BaseNegativaBusquedaFila {
  HCTACLI: string;
  HDESCLI: string;
  FECHA: string;
  TIPO: string;
  [key: string]: unknown;
}

export interface BaseNegativaResultadoRaw {
  data?: unknown[];
  /** Definición de columnas dinámica — solo viene en el resultado de detalle, no en el de búsqueda. */
  headers?: string;
}

export interface BaseNegativaResponseBody {
  resultado?: BaseNegativaResultadoRaw;
}
