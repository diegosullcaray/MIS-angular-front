import type { Observable } from 'rxjs';

/**
 * Nodo del árbol jerárquico organizativo (`base_hier`/`level_hier` del backend
 * Ant, módulo `admin` — ver `ModSysAdminService`). Forma inferida a partir del
 * uso real en el legado (`hier-rem-selector`, ej. `{ tip_cod: 7, cod_rel: '231', lvl: 1 }`
 * hardcodeado en Tablero de Verificación) — el componente legado que arma este
 * árbol no estaba en el volcado de referencia, así que esta forma no está
 * verificada contra una respuesta real del backend.
 */
export interface HierarquiaNodo {
  tip_cod: number;
  cod_rel: string;
  des_rel: string;
  lvl?: number;
}

/** Parámetros para pedir la jerarquía base de una pantalla "línea simple". */
export interface ParamsJerarquia {
  /** `cod_jer` — código de la jerarquía organizativa a explorar. */
  code: number;
  /** Profundidad máxima de niveles que puede expandir el usuario. */
  maxLvl: number;
  /** Título del diálogo/selector (ej. "JERARQUIA ADMIN. COMER."). */
  dlgTitulo: string;
}

/**
 * Metadata de edición que acompaña cada `resumen` (`bp` en el legado) — define
 * qué nivel jerárquico y qué rango de periodos son editables.
 */
export interface ResumenMetadata {
  /** Nivel jerárquico (`tip_cod`) en el que el usuario puede editar. */
  tip_cod_edi: number;
  /** Periodo (`ord`) desde el cual empieza la ventana editable. */
  ord_ini_edi: number;
  /** Fin de la ventana corta usada por Cartera Créditos para "Asesores en Producción". */
  ord_ini_edi_ASESPROD?: number;
  /** true si el usuario es el responsable vigente de este nodo. */
  act_res: boolean;
  cod_sec: string;
}

/** Fila de la tabla de una pantalla "línea simple" — columnas dinámicas según la pantalla. */
export interface FilaLineaSimple {
  /** Orden del periodo — determina la ventana editable y la cascada de cálculo. */
  ord: number;
  fec_pro?: string;
  [key: string]: unknown;
}

/** Respuesta de `getRes*` para las pantallas "línea simple" (BP, Red, Seguros, Créditos). */
export interface ResumenLineaSimple {
  ws: FilaLineaSimple[];
  bp: ResumenMetadata;
}

/** Respuesta de Cartera Créditos — además de `ws`/`bp`, trae la composición por producto. */
export interface ResumenCarteraCreditos extends ResumenLineaSimple {
  cs: FilaLineaSimple[];
}

/** Fila de la tabla de Tablero de Verificación. */
export interface LogVerificacionFila {
  des_rel: string;
  /** Estado de verificación: 1 = verificado (verde), cualquier otro valor = pendiente (rojo). */
  cod_est: number;
  usu_log: string;
  tim_log: string;
  [key: string]: unknown;
}

/**
 * Fila de la tabla de Responsables — `cod_res` es la única columna editable.
 * Firma de índice: para que `EditableTableComponent<T extends FilaTabla>` la acepte.
 */
export interface ResponsableFila {
  des_rel: string;
  cod_res: string;
  usu_log: string;
  tim_log: string;
  [key: string]: unknown;
}

/** Nivel jerárquico fijo del selector de Responsables (no usa árbol, son 6 niveles hardcodeados). */
export interface NivelJerarquiaFijo {
  tip_cod: number;
  des_lvl: string;
}

/** Tipo de dato de una columna, para decidir cómo formatear/editar su celda. */
export type TipoColumna = 'number' | 'percent' | 'text' | 'comp_f';

/** Definición de columna de tabla — soporta un nivel de agrupación (columnas con `hijos`). */
export interface ColumnaTabla {
  label: string;
  /** Ausente si la columna es solo un grupo visual (tiene `hijos`). */
  key?: string;
  tipo?: TipoColumna;
  hijos?: ColumnaTabla[];
}

/** Config de las pantallas "línea simple" genéricas (Depósitos BP/Red, Seguros Comercial/Operaciones). */
export interface LineaSimpleConfig {
  mainTitle: string;
  columnas: ColumnaTabla[];
  paramsHier: ParamsJerarquia;
  /** Columnas potencialmente editables — `'all'` habilita todas (Seguros), o una lista puntual de `key`s (Depósitos). */
  inputCols: string[] | 'all';
  obtenerResumen(tipCod: number, codRel: string): Observable<ResumenLineaSimple>;
  guardarResumen(tipCod: number, codRel: string, filas: FilaLineaSimple[]): Observable<unknown>;
  /**
   * Fórmula de cascada al editar una celda (`calculateRow` del legado) — recibe
   * el array completo de filas (para leer periodos vecinos) y muta la fila en
   * `idx` in-place. Ausente en Seguros (no hay fórmula derivada, cada celda es independiente).
   */
  calcularFila?(filas: FilaLineaSimple[], idx: number): void;
}
