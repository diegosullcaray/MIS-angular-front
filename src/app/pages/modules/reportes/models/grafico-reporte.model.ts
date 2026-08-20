/** Una serie de datos de un gráfico (legado `GraphicService.setSerie()`). */
export interface SerieGrafico {
  nombre: string;
  datos: (number | null)[];
  color?: string;
}

/** Un bloque de gráfico del motor de reportes "mixtos" (legado `ReportCrsV2Component`/`GraphicService`) — un mismo `cod_rep` puede devolver varios de estos en un array (`result`), cada uno un gráfico independiente (ej. "Inversión" y "Stock de Mora" del mismo bloque). */
export interface BloqueGrafico {
  titulo: string;
  subtitulo?: string;
  categorias: string[];
  series: SerieGrafico[];
  tituloEjeY?: string;
}
