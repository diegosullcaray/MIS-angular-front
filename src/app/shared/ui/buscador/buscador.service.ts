import { Injectable } from '@angular/core';
import type {
  ConfiguracionIndice,
  CriteriosRanking,
  EstrategiaSinResultados,
  Facetas,
  NivelCoincidencia,
  ParametrosBusqueda,
  RespuestaBusqueda,
  ResaltadoAtributo,
  Resultado,
  TipoConsulta,
} from './buscador.model';

// ─── Defaults del motor (los mismos que trae un índice de Algolia) ──────────

const MIN_PARA_UN_TYPO = 4;
const MIN_PARA_DOS_TYPOS = 8;
const MAXIMO_RESULTADOS = 20;
const TIPO_CONSULTA: TipoConsulta = 'prefijo-ultima';
const ESTRATEGIA_SIN_RESULTADOS: EstrategiaSinResultados = 'ninguna';
/** Tope de la penalización por proximidad, igual que Algolia: más allá de 8 palabras da lo mismo. */
const PROXIMIDAD_MAXIMA = 8;

const RE_TOKEN = /[\p{L}\p{N}]+/gu;
const RE_DIACRITICO = /\p{Diacritic}/gu;

// ─── Texto ─────────────────────────────────────────────────────────────────

/** Normaliza (sin acentos, minúsculas) con mapa al texto original: normalizar cambia el largo y el resaltado recorta sobre el original. */
function normalizarConMapa(texto: string): { normalizado: string; mapa: number[] } {
  let normalizado = '';
  const mapa: number[] = [];

  for (let i = 0; i < texto.length; i++) {
    const limpio = texto[i].normalize('NFD').replace(RE_DIACRITICO, '').toLowerCase();
    for (const caracter of limpio) {
      normalizado += caracter;
      mapa.push(i);
    }
  }

  return { normalizado, mapa };
}

/** Normaliza sin mapa, para comparar consultas contra tokens ya indexados. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(RE_DIACRITICO, '').toLowerCase();
}

/** Palabra de un atributo, ya normalizada y ubicada dentro del texto original. */
interface Token {
  texto: string;
  /** Offsets sobre el texto ORIGINAL, listos para recortar al resaltar. */
  inicio: number;
  fin: number;
  /** Índice de palabra dentro del atributo — alimenta el criterio de proximidad. */
  posicion: number;
}

function tokenizar(texto: string): Token[] {
  const { normalizado, mapa } = normalizarConMapa(texto);
  const tokens: Token[] = [];
  let posicion = 0;

  for (const coincidencia of normalizado.matchAll(RE_TOKEN)) {
    const desde = coincidencia.index;
    const hasta = desde + coincidencia[0].length;
    tokens.push({
      texto: coincidencia[0],
      inicio: mapa[desde],
      fin: mapa[hasta - 1] + 1,
      posicion: posicion++,
    });
  }

  return tokens;
}

/** Separa la consulta en palabras normalizadas. */
export function tokenizarConsulta(consulta: string): string[] {
  return Array.from(normalizar(consulta).matchAll(RE_TOKEN), (m) => m[0]);
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Tolerancia a typos ────────────────────────────────────────────────────

/** Damerau-Levenshtein (OSA: una transposición cuenta como un error). Corta al pasarse de `maximo` y devuelve `maximo + 1`. */
export function distanciaEdicion(a: string, b: string, maximo: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maximo) return maximo + 1;

  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let anterior2: number[] = new Array<number>(n + 1).fill(0);
  let anterior: number[] = Array.from({ length: n + 1 }, (_, j) => j);

  for (let i = 1; i <= m; i++) {
    const actual = new Array<number>(n + 1);
    actual[0] = i;
    let mejorDeLaFila = actual[0];

    for (let j = 1; j <= n; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      let valor = Math.min(actual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + costo);

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        valor = Math.min(valor, anterior2[j - 2] + 1);
      }

      actual[j] = valor;
      if (valor < mejorDeLaFila) mejorDeLaFila = valor;
    }

    // Toda la fila ya superó el tope: ninguna continuación puede bajar de ahí.
    if (mejorDeLaFila > maximo) return maximo + 1;

    anterior2 = anterior;
    anterior = actual;
  }

  return anterior[n];
}

/** Typos tolerados según el largo de la palabra (`minWordSizefor1Typo` / `minWordSizefor2Typos`). */
function typosPermitidos(palabra: string, minUno: number, minDos: number, apagado: boolean): number {
  if (apagado) return 0;
  if (palabra.length >= minDos) return 2;
  if (palabra.length >= minUno) return 1;
  return 0;
}

/** Cómo matcheó una palabra de la consulta contra un token del registro. */
interface Coincidencia {
  typos: number;
  /** El token es idéntico a la palabra buscada (ni prefijo ni typo). */
  exacta: boolean;
  /** Cuántos caracteres del token cubre la coincidencia — el resaltado usa esto. */
  largo: number;
}

function compararPalabra(palabra: string, token: string, maxTypos: number, permitePrefijo: boolean): Coincidencia | null {
  if (token === palabra) return { typos: 0, exacta: true, largo: token.length };
  if (permitePrefijo && token.startsWith(palabra)) return { typos: 0, exacta: false, largo: palabra.length };

  if (maxTypos > 0) {
    const distancia = distanciaEdicion(palabra, token, maxTypos);
    if (distancia <= maxTypos) return { typos: distancia, exacta: false, largo: token.length };

    // Prefijo con typos: se prueban varios largos (un typo corre el corte) y gana el mejor — quedarse con el primero corta el resaltado a mitad de palabra.
    if (permitePrefijo && token.length > palabra.length) {
      const desde = Math.max(1, palabra.length - maxTypos);
      const hasta = Math.min(token.length, palabra.length + maxTypos);
      let mejor: Coincidencia | null = null;

      for (let largo = desde; largo <= hasta; largo++) {
        const distanciaPrefijo = distanciaEdicion(palabra, token.slice(0, largo), maxTypos);
        if (distanciaPrefijo > maxTypos) continue;
        if (!mejor || distanciaPrefijo < mejor.typos || (distanciaPrefijo === mejor.typos && largo > mejor.largo)) {
          mejor = { typos: distanciaPrefijo, exacta: false, largo };
        }
      }

      if (mejor) return mejor;
    }
  }

  return null;
}

// ─── Índice ────────────────────────────────────────────────────────────────

/** Un registro ya tokenizado: se prepara una sola vez y se reusa en cada tecla. */
interface Documento<T> {
  objeto: T;
  /** Tokens por atributo, en el orden de `atributosBuscables`. */
  tokensPorAtributo: Token[][];
  /** Texto original por atributo. */
  textosPorAtributo: string[];
  /** Valor de cada atributo facetable. */
  facetas: Record<string, string>;
}

/** La mejor forma en que una palabra de la consulta matcheó dentro de un atributo. */
interface MejorEnAtributo extends Coincidencia {
  token: Token;
}

/** Índice en memoria con el contrato de un índice de Algolia, resuelto en el cliente: el corpus son unos cientos de nodos y no sale de la app. */
export class IndiceBuscador<T> {
  private readonly documentos: Documento<T>[];

  constructor(
    private readonly config: ConfiguracionIndice<T>,
    objetos: readonly T[]
  ) {
    this.documentos = objetos.map((objeto) => ({
      objeto,
      textosPorAtributo: config.atributosBuscables.map((a) => a.valor(objeto) ?? ''),
      tokensPorAtributo: config.atributosBuscables.map((a) => tokenizar(a.valor(objeto) ?? '')),
      facetas: Object.fromEntries((config.atributosFacetables ?? []).map((f) => [f.nombre, f.valor(objeto)])),
    }));
  }

  buscar(consulta: string, parametros: ParametrosBusqueda = {}): RespuestaBusqueda<T> {
    const arranque = performance.now();

    const tipoConsulta = parametros.tipoConsulta ?? TIPO_CONSULTA;
    const estrategia = parametros.estrategiaSinResultados ?? ESTRATEGIA_SIN_RESULTADOS;
    const maximo = parametros.maximoResultados ?? MAXIMO_RESULTADOS;
    const filtros = parametros.filtrosFaceta ?? {};
    const inicio = parametros.etiquetaResaltadoInicio ?? '<mark>';
    const fin = parametros.etiquetaResaltadoFin ?? '</mark>';

    const palabras = tokenizarConsulta(consulta);

    // Consulta vacía: se listan todos los registros, solo con el ranking
    // personalizado (es el "browse" de Algolia con query vacía).
    if (palabras.length === 0) {
      const filtrados = this.documentos
        .filter((doc) => this.pasaFiltros(doc, filtros))
        .sort((a, b) => this.desempatePersonalizado(a.objeto, b.objeto));

      return {
        resultados: filtrados.slice(0, maximo).map((doc, i) => this.aResultado(doc, [], i, inicio, fin)),
        total: filtrados.length,
        consulta,
        palabrasUsadas: 0,
        facetas: this.contarFacetas(this.documentos, filtros),
        duracionMs: performance.now() - arranque,
      };
    }

    const { coincidentes, sinFiltrarFacetas, palabrasUsadas } = this.buscarSoltandoPalabras(
      palabras,
      tipoConsulta,
      estrategia,
      filtros,
      parametros
    );

    coincidentes.sort((a, b) => this.comparar(a, b));

    return {
      resultados: coincidentes
        .slice(0, maximo)
        .map(({ doc, ranking }, i) => this.aResultado(doc, palabras, i, inicio, fin, ranking, tipoConsulta, parametros)),
      total: coincidentes.length,
      consulta,
      palabrasUsadas,
      facetas: this.contarFacetas(sinFiltrarFacetas, filtros),
      duracionMs: performance.now() - arranque,
    };
  }

  /** Corre la consulta, reintentando sin algunas palabras si la estrategia lo permite; devuelve el conjunto filtrado y el sin filtrar (para contar facetas). */
  private buscarSoltandoPalabras(
    palabras: string[],
    tipoConsulta: TipoConsulta,
    estrategia: EstrategiaSinResultados,
    filtros: Record<string, string[]>,
    parametros: ParametrosBusqueda
  ): {
    coincidentes: { doc: Documento<T>; ranking: CriteriosRanking }[];
    sinFiltrarFacetas: Documento<T>[];
    palabrasUsadas: number;
  } {
    for (let cantidad = palabras.length; cantidad >= 1; cantidad--) {
      const subconjunto =
        estrategia === 'primeras' ? palabras.slice(palabras.length - cantidad) : palabras.slice(0, cantidad);

      const todos: { doc: Documento<T>; ranking: CriteriosRanking }[] = [];
      for (const doc of this.documentos) {
        const ranking = this.evaluar(doc, subconjunto, palabras, tipoConsulta, parametros);
        if (ranking) todos.push({ doc, ranking });
      }

      const coincidentes = todos.filter(({ doc }) => this.pasaFiltros(doc, filtros));

      if (coincidentes.length > 0 || estrategia === 'ninguna') {
        return { coincidentes, sinFiltrarFacetas: todos.map((t) => t.doc), palabrasUsadas: cantidad };
      }
    }

    return { coincidentes: [], sinFiltrarFacetas: [], palabrasUsadas: 0 };
  }

  /** Criterios de ranking del registro, o `null` si no matchea todas las palabras exigidas; el prefijo solo aplica a la última palabra de la consulta original. */
  private evaluar(
    doc: Documento<T>,
    palabrasExigidas: string[],
    palabrasOriginales: string[],
    tipoConsulta: TipoConsulta,
    parametros: ParametrosBusqueda
  ): CriteriosRanking | null {
    const minUno = parametros.minimoParaUnTypo ?? MIN_PARA_UN_TYPO;
    const minDos = parametros.minimoParaDosTypos ?? MIN_PARA_DOS_TYPOS;
    const sinTypos = parametros.sinTolerarTypos ?? false;
    const ultima = palabrasOriginales[palabrasOriginales.length - 1];

    // mejores[atributo][palabra] = cómo matcheó esa palabra en ese atributo.
    const mejores: (MejorEnAtributo | null)[][] = [];

    for (let a = 0; a < doc.tokensPorAtributo.length; a++) {
      const porPalabra: (MejorEnAtributo | null)[] = [];

      for (const palabra of palabrasExigidas) {
        const permitePrefijo = this.permitePrefijo(palabra, ultima, tipoConsulta);
        const maxTypos = typosPermitidos(palabra, minUno, minDos, sinTypos);

        let mejor: MejorEnAtributo | null = null;
        for (const token of doc.tokensPorAtributo[a]) {
          const coincidencia = compararPalabra(palabra, token.texto, maxTypos, permitePrefijo);
          if (!coincidencia) continue;
          if (!mejor || coincidencia.typos < mejor.typos || (coincidencia.typos === mejor.typos && coincidencia.exacta && !mejor.exacta)) {
            mejor = { ...coincidencia, token };
          }
        }
        porPalabra.push(mejor);
      }

      mejores.push(porPalabra);
    }

    // Una palabra cuenta como matcheada si lo hizo en CUALQUIER atributo: en
    // Algolia las palabras de la consulta pueden repartirse entre atributos.
    const typosPorPalabra: number[] = [];
    const exactaPorPalabra: boolean[] = [];

    for (let p = 0; p < palabrasExigidas.length; p++) {
      let mejorTypos = Infinity;
      let exacta = false;
      for (let a = 0; a < mejores.length; a++) {
        const m = mejores[a][p];
        if (!m) continue;
        if (m.typos < mejorTypos) mejorTypos = m.typos;
        if (m.exacta) exacta = true;
      }
      if (mejorTypos === Infinity) return null; // falta una palabra exigida
      typosPorPalabra.push(mejorTypos);
      exactaPorPalabra.push(exacta);
    }

    const atributo = mejores.findIndex((porPalabra) => porPalabra.some(Boolean));

    return {
      typos: typosPorPalabra.reduce((suma, t) => suma + t, 0),
      palabras: palabrasExigidas.length,
      proximidad: this.proximidad(mejores),
      atributo,
      exactas: exactaPorPalabra.filter(Boolean).length,
    };
  }

  private permitePrefijo(palabra: string, ultima: string, tipoConsulta: TipoConsulta): boolean {
    if (tipoConsulta === 'prefijo-todas') return true;
    if (tipoConsulta === 'prefijo-ninguna') return false;
    return palabra === ultima;
  }

  /** Suma de distancias entre palabras consecutivas en el mejor atributo: que aparezcan pegadas pesa más. */
  private proximidad(mejores: (MejorEnAtributo | null)[][]): number {
    let mejorProximidad = Infinity;

    for (const porPalabra of mejores) {
      let acumulado = 0;
      let anterior: MejorEnAtributo | null = null;
      let pares = 0;

      for (const actual of porPalabra) {
        if (!actual) continue;
        if (anterior) {
          acumulado += Math.min(Math.abs(actual.token.posicion - anterior.token.posicion), PROXIMIDAD_MAXIMA);
          pares++;
        }
        anterior = actual;
      }

      if (pares > 0) mejorProximidad = Math.min(mejorProximidad, acumulado);
    }

    return mejorProximidad === Infinity ? 0 : mejorProximidad;
  }

  /** Desempate de Algolia: compara los criterios de a uno y corta en el primero que difiere; si todos empatan entra el ranking personalizado. */
  private comparar(a: { doc: Documento<T>; ranking: CriteriosRanking }, b: { doc: Documento<T>; ranking: CriteriosRanking }): number {
    if (a.ranking.typos !== b.ranking.typos) return a.ranking.typos - b.ranking.typos;
    if (a.ranking.palabras !== b.ranking.palabras) return b.ranking.palabras - a.ranking.palabras;
    if (a.ranking.proximidad !== b.ranking.proximidad) return a.ranking.proximidad - b.ranking.proximidad;
    if (a.ranking.atributo !== b.ranking.atributo) return a.ranking.atributo - b.ranking.atributo;
    if (a.ranking.exactas !== b.ranking.exactas) return b.ranking.exactas - a.ranking.exactas;
    return this.desempatePersonalizado(a.doc.objeto, b.doc.objeto);
  }

  private desempatePersonalizado(a: T, b: T): number {
    return this.config.rankingPersonalizado ? this.config.rankingPersonalizado(a, b) : 0;
  }

  private pasaFiltros(doc: Documento<T>, filtros: Record<string, string[]>): boolean {
    // Dentro de una faceta los valores son un OR; entre facetas distintas, un AND.
    return Object.entries(filtros).every(([faceta, valores]) => !valores.length || valores.includes(doc.facetas[faceta]));
  }

  /** Conteos por faceta, cada una ignorando su propio filtro (disyuntivo): si no, elegir un valor dejaría el resto en 0 y sin salida. */
  private contarFacetas(docs: Documento<T>[], filtros: Record<string, string[]>): Facetas {
    const facetas: Facetas = {};

    for (const { nombre } of this.config.atributosFacetables ?? []) {
      const otros = Object.fromEntries(Object.entries(filtros).filter(([f]) => f !== nombre));
      const conteos: Record<string, number> = {};

      for (const doc of docs) {
        if (!this.pasaFiltros(doc, otros)) continue;
        const valor = doc.facetas[nombre];
        if (valor === undefined) continue;
        conteos[valor] = (conteos[valor] ?? 0) + 1;
      }

      facetas[nombre] = conteos;
    }

    return facetas;
  }

  private aResultado(
    doc: Documento<T>,
    palabras: string[],
    posicion: number,
    inicio: string,
    fin: string,
    ranking: CriteriosRanking = { typos: 0, palabras: 0, proximidad: 0, atributo: 0, exactas: 0 },
    tipoConsulta: TipoConsulta = TIPO_CONSULTA,
    parametros: ParametrosBusqueda = {}
  ): Resultado<T> {
    const resaltado: Record<string, ResaltadoAtributo> = {};

    this.config.atributosBuscables.forEach((atributo, a) => {
      resaltado[atributo.nombre] = this.resaltar(doc, a, palabras, inicio, fin, tipoConsulta, parametros);
    });

    return { objeto: doc.objeto, resaltado, posicion, ranking };
  }

  /** Envuelve en las etiquetas de resaltado los tramos del atributo que matchearon. */
  private resaltar(
    doc: Documento<T>,
    indiceAtributo: number,
    palabras: string[],
    inicio: string,
    fin: string,
    tipoConsulta: TipoConsulta,
    parametros: ParametrosBusqueda
  ): ResaltadoAtributo {
    const texto = doc.textosPorAtributo[indiceAtributo];
    const tokens = doc.tokensPorAtributo[indiceAtributo];

    const minUno = parametros.minimoParaUnTypo ?? MIN_PARA_UN_TYPO;
    const minDos = parametros.minimoParaDosTypos ?? MIN_PARA_DOS_TYPOS;
    const sinTypos = parametros.sinTolerarTypos ?? false;
    const ultima = palabras[palabras.length - 1];

    /** Tramos a resaltar, sobre offsets del texto original. */
    const tramos: { desde: number; hasta: number }[] = [];
    const palabrasCoincidentes = new Set<string>();
    const tokensCoincidentes = new Set<number>();

    for (const token of tokens) {
      let mejor: Coincidencia | null = null;
      let mejorPalabra = '';

      for (const palabra of palabras) {
        const coincidencia = compararPalabra(
          palabra,
          token.texto,
          typosPermitidos(palabra, minUno, minDos, sinTypos),
          this.permitePrefijo(palabra, ultima, tipoConsulta)
        );
        if (!coincidencia) continue;
        if (!mejor || coincidencia.largo > mejor.largo) {
          mejor = coincidencia;
          mejorPalabra = palabra;
        }
      }

      if (!mejor) continue;

      palabrasCoincidentes.add(mejorPalabra);
      tokensCoincidentes.add(token.posicion);
      // `largo` está en caracteres normalizados y el token puede ocupar más en el original, así que se recorta contra su fin real.
      tramos.push({ desde: token.inicio, hasta: Math.min(token.inicio + mejor.largo, token.fin) });
    }

    if (tramos.length === 0) {
      return { valor: escaparHtml(texto), nivel: 'ninguna', palabrasCoincidentes: [], resaltadoCompleto: false };
    }

    let valor = '';
    let cursor = 0;
    for (const { desde, hasta } of tramos) {
      valor += escaparHtml(texto.slice(cursor, desde)) + inicio + escaparHtml(texto.slice(desde, hasta)) + fin;
      cursor = hasta;
    }
    valor += escaparHtml(texto.slice(cursor));

    const nivel: NivelCoincidencia = palabrasCoincidentes.size === palabras.length ? 'total' : 'parcial';

    return {
      valor,
      nivel,
      palabrasCoincidentes: [...palabrasCoincidentes],
      resaltadoCompleto: tokensCoincidentes.size === tokens.length && tramos.every(({ desde, hasta }, i) => hasta - desde === tokens[i].fin - tokens[i].inicio),
    };
  }
}

/** Fábrica de índices en memoria con la relevancia de Algolia; los contratos están calcados de su API, así que migrar sería reimplementar solo este servicio. */
@Injectable({ providedIn: 'root' })
export class BuscadorService {
  crearIndice<T>(config: ConfiguracionIndice<T>, objetos: readonly T[]): IndiceBuscador<T> {
    return new IndiceBuscador(config, objetos);
  }
}
