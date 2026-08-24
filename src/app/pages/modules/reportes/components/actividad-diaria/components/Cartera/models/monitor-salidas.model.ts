import type { ColumnaDinamica } from '../../../../../models/tabla-dinamica.model';

/** Una tarjeta del encabezado, tal como la manda `mon_sali_ret.resultados`. */
export interface TarjetaSalidas {
  lbl: string;
  val: number;
  /** Valor secundario (variación); el legado lo pinta en rojo si es negativo. */
  val2?: number;
  lbl2?: string;
  /** `number`, `percent` u otro: decide el formato del valor. */
  typ?: string;
  /** Semáforo; `-99` significa "sin semáforo". */
  tl?: number;
}

export interface ResultadoSalidas {
  cards: TarjetaSalidas[];
  table: Record<string, unknown>[];
}

export const RESULTADO_SALIDAS_VACIO: ResultadoSalidas = { cards: [], table: [] };

/** `tip` de `mon_sali_ret.detalle` según la métrica que se abrió — legado `lista-clientes.component.ts`. */
export const TIPO_DETALLE: Record<string, number> = { sali1: 1, sali3: 2, clive: 3 };

/** Título del detalle según esa misma métrica — legado `detalle-base.component.ts`. */
export const TITULO_DETALLE: Record<string, string> = {
  sali1: 'Salidas en el Mes',
  sali3: 'Salidas en los Últimos 3 Meses',
  clive: 'Clientes Por Vencer al Cierre de Mes',
};

/**
 * Las tarjetas 0 y 3 no abren detalle en el legado (`detCard()` corta en
 * `[0, 3].includes(idx)`); las demás mapean a una métrica de la tabla.
 */
export function metricaDeTarjeta(indice: number): string | undefined {
  if (indice === 0 || indice === 3) return undefined;
  return indice === 1 ? 'sali1' : indice === 2 ? 'sali3' : 'clive';
}

/** Columnas de la tabla del nivel — legado `principal.util.ts` (`tblHeaders`). */
export const COLUMNAS_SALIDAS: ColumnaDinamica[] = [
  { key: 'desc', label: 'Descripción' },
  { key: 'sali1', label: 'Salida en el mes', format: { type: 'integer' } },
  { key: 'sali3', label: 'Salidas en los últimos 3M', format: { type: 'integer' } },
  { key: 'ret', label: 'Churn rate', format: { type: 'percent' } },
  { key: 'clive', label: 'Clientes por Vencer', format: { type: 'integer' } },
];

/** Columnas del listado de clientes — legado `lista-clientes.util.ts`. */
export const COLUMNAS_CLIENTES_SALIDAS: ColumnaDinamica[] = [
  { key: 'ndoc', label: 'Nro. Documento' },
  { key: 'nom', label: 'Nombre' },
  { key: 'pri', label: 'Prioridad' },
  { key: 'mon_desem', label: 'Monto Desembolsado', format: { type: 'integer' } },
  { key: 'nrie', label: 'Nivel de Riesgo' },
  { key: 'fec_eval', label: 'Fecha de Salida' },
  { key: 'uni', label: 'Unidad' },
  { key: 'ase', label: 'Asesor' },
];

/** Cuántos clientes trae el detalle; el legado arranca en 10 y deja cambiarlo. */
export const TOPES_DETALLE = [10, 25, 50, 100];
export const TOPE_DETALLE_POR_DEFECTO = 10;

/**
 * Color del churn rate — legado `tlFn` de `principal.util.ts`.
 * Ojo: acá más alto es mejor (retención), al revés que una mora.
 */
export function colorChurn(valor: number | null | undefined): string {
  if (valor == null || valor < 0.9025) return 'var(--mis-danger)';
  if (valor < 0.95) return 'var(--mis-warning)';
  return 'var(--mis-success)';
}
