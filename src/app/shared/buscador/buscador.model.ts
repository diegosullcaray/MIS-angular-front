/**
 * Contratos del buscador. Están calcados del motor de Algolia (mismos
 * criterios, mismos defaults, misma forma de respuesta) pero con nombres en
 * español, como el resto del código. Entre paréntesis va el nombre original
 * de Algolia para poder cruzarlo con su documentación.
 */

/** Cuánto cubrió la consulta a un atributo (`matchLevel` de Algolia). */
export type NivelCoincidencia = 'ninguna' | 'parcial' | 'total';

/** Cómo se matchea la última palabra de la consulta (`queryType`). */
export type TipoConsulta =
  /** Solo la última palabra admite prefijo — es el default de Algolia (`prefixLast`). */
  | 'prefijo-ultima'
  /** Todas las palabras admiten prefijo (`prefixAll`). */
  | 'prefijo-todas'
  /** Ninguna admite prefijo: se exige la palabra completa (`prefixNone`). */
  | 'prefijo-ninguna';

/** Qué hacer cuando la consulta completa no devuelve nada (`removeWordsIfNoResults`). */
export type EstrategiaSinResultados =
  /** No reintenta: si falta una palabra, no hay resultados. Default de Algolia (`none`). */
  | 'ninguna'
  /** Reintenta soltando palabras desde el final (`lastWords`). */
  | 'ultimas'
  /** Reintenta soltando palabras desde el principio (`firstWords`). */
  | 'primeras';

/** Resaltado de un atributo (`_highlightResult[attr]`). */
export interface ResaltadoAtributo {
  /** Texto del atributo, escapado, con las coincidencias envueltas en las etiquetas de resaltado. */
  valor: string;
  nivel: NivelCoincidencia;
  /** Palabras de la consulta que coincidieron en este atributo (`matchedWords`). */
  palabrasCoincidentes: string[];
  /** True si el atributo quedó resaltado por completo (`fullyHighlighted`). */
  resaltadoCompleto: boolean;
}

/**
 * Los 5 criterios de desempate que aplican acá, en el orden en que Algolia los
 * evalúa. Se comparan de a uno: solo si dos registros empatan en el primero se
 * mira el segundo, y así. Los criterios `geo` y `filters` de Algolia no
 * aplican (no hay coordenadas ni filtros opcionales con peso).
 *
 * Ver https://www.algolia.com/doc/guides/managing-results/relevance-overview/in-depth/ranking-criteria/
 */
export interface CriteriosRanking {
  /** Typos acumulados de todas las palabras que matchearon. Menos es mejor. */
  typos: number;
  /** Palabras de la consulta que matchearon. Más es mejor. */
  palabras: number;
  /** Distancia entre las palabras dentro del atributo. Menos es mejor. */
  proximidad: number;
  /** Índice del mejor atributo que matcheó, según el orden de `atributosBuscables`. Menos es mejor. */
  atributo: number;
  /** Palabras que matchearon exactas (sin typo ni prefijo). Más es mejor. */
  exactas: number;
}

/** Un resultado (`hit`). */
export interface Resultado<T> {
  objeto: T;
  /** Resaltado por atributo buscable (`_highlightResult`). */
  resaltado: Record<string, ResaltadoAtributo>;
  /** Puesto en el ranking, 0-based (el `__position` de Algolia es 1-based). */
  posicion: number;
  /** Con qué valores se ordenó. Se expone para poder depurar el ranking. */
  ranking: CriteriosRanking;
}

/** Conteo de valores por faceta: `{ sistema: { Reportes: 12, Analista: 3 } }`. */
export type Facetas = Record<string, Record<string, number>>;

/** Respuesta de una búsqueda, con la misma forma que la de Algolia. */
export interface RespuestaBusqueda<T> {
  resultados: Resultado<T>[];
  /** Total de registros que matchearon (`nbHits`). */
  total: number;
  /** La consulta tal cual se pidió. */
  consulta: string;
  /**
   * Cuántas palabras de la consulta se terminaron exigiendo. Es menor que el
   * total cuando `estrategiaSinResultados` tuvo que soltar palabras.
   */
  palabrasUsadas: number;
  /** Conteos por faceta sobre el conjunto de resultados (`facets`). */
  facetas: Facetas;
  /** Milisegundos que tardó el motor (`processingTimeMS`). */
  duracionMs: number;
}

/** Configuración de un índice, equivalente a los `settings` de un índice de Algolia. */
export interface ConfiguracionIndice<T> {
  /**
   * Atributos donde se busca, del más al menos importante. El orden es
   * significativo: alimenta el criterio `atributo` del ranking, igual que
   * `searchableAttributes` en Algolia.
   */
  atributosBuscables: {
    nombre: string;
    /** Extrae el texto del registro. */
    valor: (objeto: T) => string;
  }[];
  /** Atributos por los que se puede facetar (`attributesForFaceting`). */
  atributosFacetables?: {
    nombre: string;
    valor: (objeto: T) => string;
  }[];
  /**
   * Desempate final, cuando los 5 criterios textuales empataron
   * (`customRanking`). Devuelve <0 si `a` va antes que `b`.
   */
  rankingPersonalizado?: (a: T, b: T) => number;
  /** Identidad estable del registro, para `track` en las listas (`objectID`). */
  id: (objeto: T) => string;
}

/** Parámetros de una búsqueda puntual (los `searchParameters` de Algolia). */
export interface ParametrosBusqueda {
  /** Default `prefijo-ultima`, igual que Algolia. */
  tipoConsulta?: TipoConsulta;
  /** Default `ninguna`, igual que Algolia. */
  estrategiaSinResultados?: EstrategiaSinResultados;
  /** Corta la lista de resultados (`hitsPerPage`). Default 20, igual que Algolia. */
  maximoResultados?: number;
  /**
   * Refinamientos por faceta: `{ sistema: ['Reportes'] }`. Dentro de una misma
   * faceta los valores son un OR; entre facetas distintas, un AND — igual que
   * los `facetFilters` de Algolia.
   */
  filtrosFaceta?: Record<string, string[]>;
  /** Etiquetas de resaltado. Algolia usa `<em>`; acá `<mark>`, que es el elemento semántico de "coincidencia de búsqueda". */
  etiquetaResaltadoInicio?: string;
  etiquetaResaltadoFin?: string;
  /** Longitud mínima de palabra para tolerar 1 typo (`minWordSizefor1Typo`). Default 4. */
  minimoParaUnTypo?: number;
  /** Longitud mínima de palabra para tolerar 2 typos (`minWordSizefor2Typos`). Default 8. */
  minimoParaDosTypos?: number;
  /** Apaga la tolerancia a typos (`typoTolerance: false`). */
  sinTolerarTypos?: boolean;
}
