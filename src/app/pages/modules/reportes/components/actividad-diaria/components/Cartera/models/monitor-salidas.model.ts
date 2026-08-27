import type { ColumnaDinamica } from '../../../../../models/tabla-dinamica.model';
import type { DataTableColumn } from '../../../../../../../../shared/ui/data-table/data-table.model';

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

/**
 * Clave sintética donde se guarda el semáforo del churn de cada fila.
 *
 * El legado lo resuelve con un `trafficFn` que recibe el valor de la celda; acá
 * `<app-tabla-dinamica>` espera el semáforo en otra clave de la fila
 * (`semaforoKey`), así que se precalcula antes de pintar.
 */
export const CLAVE_SEMAFORO_CHURN = 'ret_tl';

/**
 * Columnas de la tabla del nivel — legado `principal.util.ts` (`tblHeaders`).
 *
 * El punto de color va SOLO en "Churn rate": es la única columna que declara
 * `trafficFn` en el legado.
 */
export const COLUMNAS_SALIDAS: ColumnaDinamica[] = [
  { key: 'desc', label: 'Descripción' },
  { key: 'sali1', label: 'Salida en el mes', format: { type: 'integer' } },
  { key: 'sali3', label: 'Salidas en los últimos 3M', format: { type: 'integer' } },
  { key: 'ret', label: 'Churn rate', format: { type: 'percent' }, semaforoKey: CLAVE_SEMAFORO_CHURN },
  { key: 'clive', label: 'Clientes por Vencer', format: { type: 'integer' } },
];

/**
 * Columnas del listado de clientes del diálogo de detalle — legado `lista-clientes.util.ts`
 * (`headers1`/`headers2`, que solo difieren en el nombre de la columna de fecha; acá se
 * unifican en una sola lista con `fec_eval`).
 *
 * Pasa de `<app-tabla-dinamica>` a `<app-data-table>`: el legado no tenía filtro propio en este
 * diálogo, pero con listados largos (cientos de clientes) hace falta poder buscar y filtrar por
 * columna en vez de scrollear.
 */
export const COLUMNAS_CLIENTES_SALIDAS: DataTableColumn[] = [
  { field: 'ndoc', header: 'Nro. Documento', filterType: 'text' },
  { field: 'nom', header: 'Nombre', width: '16rem', filterType: 'text' },
  { field: 'pri', header: 'Prioridad', align: 'right', filterType: 'number' },
  { field: 'mon_desem', header: 'Monto Desembolsado', align: 'right', filterType: 'number' },
  { field: 'nrie', header: 'Nivel de Riesgo', filterType: 'text' },
  { field: 'fec_eval', header: 'Fecha de Salida', filterType: 'date' },
  { field: 'uni', header: 'Unidad', width: '14rem', filterType: 'text' },
  { field: 'ase', header: 'Asesor', width: '14rem', filterType: 'text' },
];

/** Campos por los que busca el buscador libre del diálogo — nombre, unidad y asesor. */
export const BUSQUEDA_CLIENTES_SALIDAS = ['nom', 'uni', 'ase'];

/** Cuántos clientes trae el detalle; el legado arranca en 10 y deja cambiarlo. */
export const TOPES_DETALLE = [10, 25, 50, 100];
export const TOPE_DETALLE_POR_DEFECTO = 10;

/**
 * Semáforo del churn rate — legado `tlFn` de `principal.util.ts`, con sus
 * mismos umbrales.
 *
 * Ojo: acá más alto es mejor (retención), al revés que una mora. Devuelve el
 * `-1`/`0`/`1` que entiende `<app-tabla-dinamica>`, que los pinta rojo, naranja
 * y verde — los tres colores del legado.
 */
export function semaforoChurn(valor: number | null | undefined): -1 | 0 | 1 {
  if (valor == null || valor < 0.9025) return -1;
  if (valor < 0.95) return 0;
  return 1;
}

/** Agrega a cada fila el semáforo de su churn, que es lo que pinta el punto de color. */
export function conSemaforoChurn(filas: Record<string, unknown>[]): Record<string, unknown>[] {
  return filas.map((fila) => ({ ...fila, [CLAVE_SEMAFORO_CHURN]: semaforoChurn(fila['ret'] as number) }));
}
