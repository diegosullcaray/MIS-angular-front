/** Contratos del buscador, calcados de Algolia con nombres en español; entre paréntesis va el nombre original. */

/** Cuánto cubrió la consulta a un atributo (`matchLevel` de Algolia). */
export type NivelCoincidencia = 'ninguna' | 'parcial' | 'total';

/** Ítem indexable: denominador común entre el árbol de navegación y la data de cada módulo. */
export interface RegistroBuscable {
  /** Identidad estable; también evita indexar dos veces lo mismo. */
  id: string;
  /** Lo que se busca y se muestra en grande. */
  etiqueta: string;
  /** Contexto legible: `Reportes › Avance Comercial`. */
  ubicacion: string;
  /** Faceta: de qué módulo salió (`Reportes`, `Dashboards Integrados`…). */
  origen: string;
  /** Faceta: qué clase de ítem es (`Reporte`, `Carpeta`, `Dashboard`…). */
  tipo: string;
  /** Qué hacer al elegirlo. Lo define la fuente, que es la que sabe navegar. */
  abrir: () => void;
}

/** Fuente de registros: cada módulo aporta la data que ya tiene cargada (vacía si no cargó nada). Se registran con el multi-token `FUENTE_BUSQUEDA`. */
export interface FuenteBusqueda {
  readonly id: string;
  /** Debe ser reactivo (leer signals): el buscador lo evalúa dentro de un `computed`. */
  registros(): RegistroBuscable[];
}

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

/** Los 5 criterios de desempate de Algolia que aplican acá, en su orden de evaluación (`geo` y `filters` no aplican). */
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
  /** Palabras de la consulta finalmente exigidas; menor que el total si `estrategiaSinResultados` soltó alguna. */
  palabrasUsadas: number;
  /** Conteos por faceta sobre el conjunto de resultados (`facets`). */
  facetas: Facetas;
  /** Milisegundos que tardó el motor (`processingTimeMS`). */
  duracionMs: number;
}

/** Configuración de un índice, equivalente a los `settings` de un índice de Algolia. */
export interface ConfiguracionIndice<T> {
  /** Atributos donde se busca, del más al menos importante; el orden alimenta el criterio `atributo` del ranking. */
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
  /** Desempate final si los 5 criterios textuales empataron (`customRanking`); <0 si `a` va antes que `b`. */
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
  /** Refinamientos por faceta (`{ sistema: ['Reportes'] }`): OR dentro de una faceta, AND entre facetas distintas. */
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
