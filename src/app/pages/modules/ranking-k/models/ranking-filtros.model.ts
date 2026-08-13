/** Criterio de filtrado aplicado a las filas del ranking. */
export interface RankingFiltros {
  usuario: string;
  puntosMin: number;
  puntosMax: number;
  lugares: string[];
  limitePosiciones: number;
}

/** Modelo de estado del formulario de filtros. */
export interface FiltrosFormModel {
  usuario: string;
  lugares: string[];
  rangoPuntos: [number, number];
  limitePosiciones: number;
}
