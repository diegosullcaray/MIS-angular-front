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

/** Fila base de una pantalla "línea simple" — toda fila concreta la extiende con sus propias columnas. */
export interface FilaLineaSimple {
  /** Orden del periodo — determina la ventana editable y la cascada de cálculo. */
  ord: number;
  fec_pro?: string;
  [key: string]: unknown;
}

/**
 * Fila de Depósitos (BP y Red comparten exactamente esta forma — 3 productos:
 * Ahorros (`a*`), CTS (`b*`), Plazo Fijo (`c*`), cada uno con Saldo Inicial /
 * Variación (editable) / Saldo Final).
 */
export interface FilaDeposito extends FilaLineaSimple {
  a1: number;
  a2: number;
  a3: number;
  b1: number;
  b2: number;
  b3: number;
  c1: number;
  c2: number;
  c3: number;
}

/** Fila de Seguros Comercial — 6 columnas independientes, todas potencialmente editables (`inputCols: 'all'`). */
export interface FilaSegurosComercial extends FilaLineaSimple {
  a1: number; // Multiriesgo
  a2: number; // Multicrédito
  a3: number; // Protección Cuotas
  a4: number; // Agrícola
  a5: number; // OncoCréditos
  a6: number; // Protección Total
}

/** Fila de Seguros Operaciones — claves de negocio propias (no siguen el patrón a1/a2/...). */
export interface FilaSegurosOperaciones extends FilaLineaSimple {
  seg_ope_mul_ah: number; // Multiahorro
  seg_ope_pro_tar: number; // Protección Tarjetas
  seg_ope_soat: number; // SOAT
  seg_ope_pro_total: number; // Protección Total
  seg_ope_onco_ahorros: number; // OncoAhorros
}

/** Fila de la tab "Variables" de Cartera Créditos. */
export interface FilaCarteraCreditosVariables extends FilaLineaSimple {
  a1: number; // Saldo Inicial
  a2: number; // Saldo Castigado
  a3: number; // Saldo Cierre (calculado)
  b1: number; // Asesores Nuevos
  b2: number; // Asesores en Producción
  b3: number; // Productividad por Asesor
  b4: number; // Operaciones Desembolsadas (calculado)
  b5: number; // Ticket Promedio
  b6: number; // Monto Desembolsado (calculado)
  c1: number; // Ratio Cancelación
  c2: number; // Monto Cancelado (calculado)
}

/** Ids de negocio de los 11 productos de la composición por producto — no son consecutivos (`18`/`99`). */
export type IdProductoComposicion = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '18' | '99';

/**
 * Fila de las tabs "Comp. Prod. Monto"/"Comp. Prod. Ratio" de Cartera Créditos —
 * `d_<id>` (monto, calculado) y `g_<id>` (ratio, dato de entrada) por cada
 * producto de `IdProductoComposicion`.
 */
export type FilaCarteraCreditosComposicion = FilaLineaSimple &
  { [K in IdProductoComposicion as `d_${K}`]?: number } &
  { [K in IdProductoComposicion as `g_${K}`]?: number };

/** Respuesta de `getRes*` para las pantallas "línea simple" genéricas (BP, Red, Seguros). */
export interface ResumenLineaSimple<F extends FilaLineaSimple = FilaLineaSimple> {
  ws: F[];
  bp: ResumenMetadata;
}

/** Respuesta de Cartera Créditos — además de `ws`/`bp`, trae la composición por producto (`cs`). */
export interface ResumenCarteraCreditos {
  ws: FilaCarteraCreditosVariables[];
  cs: FilaCarteraCreditosComposicion[];
  bp: ResumenMetadata;
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
export interface LineaSimpleConfig<F extends FilaLineaSimple = FilaLineaSimple> {
  mainTitle: string;
  columnas: ColumnaTabla[];
  paramsHier: ParamsJerarquia;
  /** Columnas potencialmente editables — `'all'` habilita todas (Seguros), o una lista puntual de `key`s (Depósitos). */
  inputCols: string[] | 'all';
  obtenerResumen(tipCod: number, codRel: string): Observable<ResumenLineaSimple<F>>;
  guardarResumen(tipCod: number, codRel: string, filas: F[]): Observable<unknown>;
  /**
   * Fórmula de cascada al editar una celda (`calculateRow` del legado) — recibe
   * el array completo de filas (para leer periodos vecinos) y muta la fila en
   * `idx` in-place. Ausente en Seguros (no hay fórmula derivada, cada celda es independiente).
   */
  calcularFila?(filas: F[], idx: number): void;
}
