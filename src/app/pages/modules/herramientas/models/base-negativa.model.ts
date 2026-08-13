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
