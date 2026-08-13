import type { Observable } from 'rxjs';
import type { ParamsJerarquia } from './jerarquia.model';
import type { ColumnaTabla } from './tabla.model';

/** Fila base de una pantalla "línea simple" — toda fila concreta la extiende con sus propias columnas. */
export interface FilaLineaSimple {
  /** Orden del periodo — determina la ventana editable y la cascada de cálculo. */
  ord: number;
  fec_pro?: string;
  [key: string]: unknown;
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

/** Respuesta de `getRes*` para las pantallas "línea simple" genéricas (BP, Red, Seguros). */
export interface ResumenLineaSimple<F extends FilaLineaSimple = FilaLineaSimple> {
  ws: F[];
  bp: ResumenMetadata;
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
