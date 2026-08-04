/** Categoría del ranking (fila de la tabla "Principal" del legado STG). */
export interface CategoriaRanking {
  name: string;
  reportType: string;
  /** Identificador de la categoría — se usa para pedir su detalle (`getDetalleRanking`). */
  rdestip: string;
}

/** Fila del desglose de una categoría — el legado no fija un esquema único, así que queda abierto. */
export type FilaDetalleRanking = Record<string, string | number>;
