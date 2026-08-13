/** Forma cruda de `resultado` para el SP `RS_BASE_NEG_01` — mismo endpoint en modo búsqueda (columnas fijas) y detalle (columnas dinámicas). */
export interface BaseNegativaResultadoRaw {
  data?: unknown[];
  /** Definición de columnas dinámica — solo viene en el resultado de detalle, no en el de búsqueda. */
  headers?: string;
}

export interface BaseNegativaResponseBody {
  resultado?: BaseNegativaResultadoRaw;
}
