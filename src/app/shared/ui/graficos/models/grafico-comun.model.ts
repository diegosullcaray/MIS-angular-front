/** Una serie de datos de un gráfico (legado `GraphicService.setSerie()`). */
export interface SerieGrafico {
  nombre: string;
  datos: (number | null)[];
  /** Fuerza el color de la serie; si se omite, lo decide la fábrica según el rol de la serie. */
  color?: string;
  /**
   * Manda la serie al eje secundario, como spline.
   *
   * Por defecto ahí solo van las series de porcentaje (las que traen "%" en el
   * nombre). Esto es para los evolutivos que combinan un NIVEL con su VARIACIÓN
   * — "Saldo Cartera Vigente", "Variación Cliente Stock" —, donde las dos series
   * son del mismo tipo pero de órdenes de magnitud distintos: con un solo eje la
   * variación queda aplastada contra el cero.
   */
  secundaria?: boolean;
}

/**
 * Un bloque de gráfico del motor de reportes "mixtos" (legado `ReportCrsV2Component`/`GraphicService`)
 * — un mismo `cod_rep` puede devolver varios de estos en un array (`result`), cada uno un gráfico
 * independiente (ej. "Inversión" y "Stock de Mora" del mismo bloque).
 *
 * Es el formato simple que consumen `<app-grafico-mixto>` y las funciones de
 * `utils/highcharts-factory.util.ts`: categorías + series, sin nada de Highcharts.
 */
export interface BloqueGrafico {
  titulo: string;
  subtitulo?: string;
  categorias: string[];
  series: SerieGrafico[];
  tituloEjeY?: string;
}

/** Una porción de un gráfico de torta/dona (`<app-grafico-pie>`). */
export interface PorcionGrafico {
  nombre: string;
  valor: number;
  color?: string;
}

/**
 * Forma del gráfico mixto.
 * - `auto`: se infiere de las series (ver `inferirTipo()` en la fábrica).
 * - `barra`: barras horizontales; `columna`: barras verticales; `linea`: solo splines.
 *
 * En los tres primeros, las series cuyo nombre trae "%" van igual como spline sobre el eje secundario.
 */
export type TipoGraficoMixto = 'auto' | 'barra' | 'columna' | 'linea';

/** Cómo se formatean los valores en el tooltip: importe en soles o número pelado. */
export type FormatoValor = 'soles' | 'numero';

/** Ajustes opcionales de presentación que aceptan las fábricas y los componentes de gráfico. */
export interface OpcionesGrafico {
  tipo?: TipoGraficoMixto;
  formato?: FormatoValor;
  /** Para gráficos embebidos en tarjetas que ya traen su propio fondo. */
  fondoTransparente?: boolean;
  /** Solo en torta: la vacía por el centro (`innerSize`) para dejarla como dona. */
  dona?: boolean;
}
