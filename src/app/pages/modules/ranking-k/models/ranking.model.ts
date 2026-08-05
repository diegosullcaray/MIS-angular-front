/** Fila genérica de un ranking/leaderboard. */
export interface RankingTableFila {
  /** Posición dentro del grupo (1 = primer lugar). */
  posicion: number;
  etiqueta: string;
  valor: number;
}

/** Un grupo (`hdester` — territorio/zona) con su propia tabla de posiciones. */
export interface GrupoRanking {
  hdester: string;
  filas: RankingTableFila[];
}

/** Criterio de filtrado aplicado sobre las filas de una categoría del ranking. */
export interface RankingFiltros {
  usuario: string;
  puntosMin: number;
  puntosMax: number;
  lugares: string[];
  limitePosiciones: number;
}

/** Modelo interno del formulario de filtros basado en Signal Forms. */
export interface FiltrosFormModel {
  usuario: string;
  lugares: string[];
  rangoPuntos: [number, number];
  limitePosiciones: number;
}
