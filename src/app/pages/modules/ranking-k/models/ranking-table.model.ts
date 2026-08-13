/** Fila genérica de una tabla de posiciones de ranking. */
export interface RankingTableFila {
  posicion: number;
  etiqueta: string;
  valor: number;
}

/** Grupo (zona/territorio) con su tabla de posiciones. */
export interface GrupoRanking {
  hdester: string;
  filas: RankingTableFila[];
}
