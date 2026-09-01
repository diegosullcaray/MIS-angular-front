import type { ColumnaDinamica } from '../../../../../models/tabla-dinamica.model';
import type { DataTableColumn } from '../../../../../../../../shared/ui/data-table/data-table.model';

/** Tarjeta del encabezado. */
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

/** Tipo de detalle de salidas. */
export const TIPO_DETALLE: Record<string, number> = { sali1: 1, sali3: 2, clive: 3 };

/** Títulos de detalle. */
export const TITULO_DETALLE: Record<string, string> = {
  sali1: 'Salidas en el Mes',
  sali3: 'Salidas en los Últimos 3 Meses',
  clive: 'Clientes Por Vencer al Cierre de Mes',
};

/** Obtiene la métrica correspondiente a la tarjeta. */
export function metricaDeTarjeta(indice: number): string | undefined {
  if (indice === 0 || indice === 3) return undefined;
  return indice === 1 ? 'sali1' : indice === 2 ? 'sali3' : 'clive';
}

/** Clave para el semáforo de churn. */
export const CLAVE_SEMAFORO_CHURN = 'ret_tl';

/** Columnas de Salidas. */
export const COLUMNAS_SALIDAS: ColumnaDinamica[] = [
  { key: 'desc', label: 'Descripción' },
  { key: 'sali1', label: 'Salida en el mes', format: { type: 'integer' } },
  { key: 'sali3', label: 'Salidas en los últimos 3M', format: { type: 'integer' } },
  { key: 'ret', label: 'Churn rate', format: { type: 'percent' }, semaforoKey: CLAVE_SEMAFORO_CHURN },
  { key: 'clive', label: 'Clientes por Vencer', format: { type: 'integer' } },
];

/** Columnas de clientes de salidas. */
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

/** Campos de búsqueda. */
export const BUSQUEDA_CLIENTES_SALIDAS = ['nom', 'uni', 'ase'];

/** Topes del detalle. */
export const TOPES_DETALLE = [10, 25, 50, 100];
export const TOPE_DETALLE_POR_DEFECTO = 10;

/** Semáforo del churn rate. */
export function semaforoChurn(valor: number | null | undefined): -1 | 0 | 1 {
  if (valor == null || valor < 0.9025) return -1;
  if (valor < 0.95) return 0;
  return 1;
}

/** Agrega semáforo a filas. */
export function conSemaforoChurn(filas: Record<string, unknown>[]): Record<string, unknown>[] {
  return filas.map((fila) => ({ ...fila, [CLAVE_SEMAFORO_CHURN]: semaforoChurn(fila['ret'] as number) }));
}
