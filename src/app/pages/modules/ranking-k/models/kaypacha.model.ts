/** Categoría del ranking (fila de la tabla "Principal" del legado STG). */
export interface CategoriaRanking {
  name: string;
  reportType: string;
  /** Identificador de la categoría — se usa para pedir su detalle (`getDetalleRanking`). */
  rdestip: string;
}

/**
 * Fila del desglose de una categoría (`detallek.component.ts`/`.util.ts` del
 * legado): posición (`ROWNUMBER`), nombre (`HCOLNOM`) y puntaje
 * (`TOTAL_MES`), agrupada por `hdester` (territorio/zona).
 */
export interface FilaDetalleRanking {
  ROWNUMBER: number;
  HCOLNOM: string;
  TOTAL_MES: number;
  hdester: string;
}

/**
 * Desglose de una categoría: filas + fecha de corte de la data (`fechaMax`).
 */
export interface DetalleRanking {
  filas: FilaDetalleRanking[];
  fechaActualizacion: string | null;
}

/**
 * Forma real de `response.body` para las rutas `kaypacha.*` del backend.
 */
export interface KaypachaResponseBody {
  resultado?: {
    list?: Array<{ JSONLIST: string }>;
    datTable?: Array<{ fechaMax?: string }> | string;
  };
}
