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
 * (`TOTAL_MES`), agrupada por `hdester` (territorio/zona) — el legado
 * agrupa por `hdester` y muestra una tabla separada por cada grupo.
 */
export interface FilaDetalleRanking {
  ROWNUMBER: number;
  HCOLNOM: string;
  TOTAL_MES: number;
  hdester: string;
}

/**
 * Desglose de una categoría: filas + fecha de corte de la data (`fechaMax`
 * del legado, `detallek.component.ts`: `this.fechaMax = r.datTable[0].fechaMax`).
 */
export interface DetalleRanking {
  filas: FilaDetalleRanking[];
  fechaActualizacion: string | null;
}
