import type { OpcionFiltro } from '../../../../../models/filtros.model';
import type { ColumnaDinamica } from '../../../../../models/tabla-dinamica.model';

/** Catálogos de filtro de Cartera en Mora. */

/** Opciones de precosecha. */
export const OPCIONES_PRECOSECHA: OpcionFiltro[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: '3', desc: '3 Meses' },
  { id: '6', desc: '6 Meses' },
];

/** Opciones de tipo de cuota. */
export const OPCIONES_TIPO_CUOTA: OpcionFiltro[] = [
  { id: '1', desc: 'Total' },
  { id: '2', desc: 'Nuevo Ingreso' },
  { id: '3', desc: 'Mantiene' },
];
export const TIPO_CUOTA_POR_DEFECTO = '1';

/** Opciones de tipo de cuota para Base de Gestión. */
export const OPCIONES_TIPO_CUOTA_BASE: OpcionFiltro[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: 'Nuevo', desc: 'Nuevo Ingreso' },
  { id: 'Mantiene', desc: 'Mantiene' },
];
export const TIPO_CUOTA_BASE_POR_DEFECTO = 'TODO';

/** Opciones de producto para Nuevo Ingreso. */
export const OPCIONES_PRODUCTO_NUEVO_INGRESO: OpcionFiltro[] = [
  { id: '0', desc: 'Todos' },
  { id: '1', desc: 'AGROPECUARIO' },
  { id: '2', desc: 'CONSTRUYENDO CONFIANZA' },
  { id: '4', desc: 'EMPRENDIENDO CONFIANZA' },
  { id: '6', desc: 'PALABRA DE MUJER' },
  { id: '7', desc: 'CONSUMO' },
  { id: '8', desc: 'GARANTIA LIQUIDA' },
  { id: '9', desc: 'TRABAJADORES FC' },
  { id: '12', desc: 'INICIANDO CONFIANZA' },
  { id: '16', desc: 'CREDITOS FAE' },
  { id: '17', desc: 'CREDITOS REACTIVA' },
  { id: '19', desc: 'INICIANDO NEGOCIOS' },
  { id: '20', desc: 'INCLUSION FAE MUJER' },
  { id: '21', desc: 'NEGOCIOS FAE MUJER' },
];
export const PRODUCTO_NUEVO_INGRESO_POR_DEFECTO = '0';

// ─── Monitor IMR (repositorio `mon-imr`, backend `rep2`) ────────────────────────

/** Opciones de Impulsa IMR. */
export const OPCIONES_IMPULSA_IMR: OpcionFiltro<number>[] = [
  { id: 1, desc: 'Total' },
  { id: 2, desc: 'Sin Impulsa' },
];
export const IMPULSA_IMR_POR_DEFECTO = 1;

/** Tarjeta del encabezado de Monitor IMR. */
export interface TarjetaImr {
  lbl: string;
  val: number;
  /** Valor secundario (variación); el legado lo pinta aparte. */
  val2?: number;
  lbl2?: string;
  /** `number`, `percent` u otro: decide el formato del valor. */
  typ?: string;
  /** Semáforo; `-99` significa "sin semáforo". */
  tl?: number;
}

export interface ResultadoImr {
  cards: TarjetaImr[];
  table: Record<string, unknown>[];
  /** Encabezados de la tabla. */
  columnas: ColumnaDinamica[];
}

export const RESULTADO_IMR_VACIO: ResultadoImr = { cards: [], table: [], columnas: [] };

/** Tipo de detalle IMR. */
export const TIPO_DETALLE_IMR: Record<string, number> = { sali1: 1, sali2: 2, sali3: 3, sali4: 4, sali5: 5 };

/** Títulos del detalle IMR. */
export const TITULO_DETALLE_IMR: Record<string, string> = {
  sali1: 'IMR en el Mes',
  sali2: 'Entradas',
  sali3: 'Salidas',
  sali4: 'Salidas hasta s/600',
  sali5: 'Salidas mayor a s/600',
};


/** Columnas de clientes IMR. */
export const COLUMNAS_CLIENTES_IMR: ColumnaDinamica[] = [
  { key: 'HDESCLI', label: 'Cliente' },
  { key: 'HCTACLI', label: 'Cuenta' },
  { key: 'HCODOPE', label: 'Operación' },
  { key: 'HMONMN', label: 'Saldo Vencido', format: { type: 'integer' } },
  { key: 'HTIPCRE', label: 'Tipo de crédito' },
  { key: 'HDIATR', label: 'Días de atraso' },
  { key: 'HFECDES', label: 'Fecha de Desembolso' },
  { key: 'RDESUNI', label: 'Unidad' },
  { key: 'RDESSEC', label: 'Asesor' },
];

/** Topes del detalle IMR. */
export const TOPES_DETALLE_IMR = [10, 25, 50, 100];
export const TOPE_DETALLE_IMR_POR_DEFECTO = 10;

/** Columnas que abren el detalle. */
export const COLUMNAS_CON_DETALLE_IMR = ['sali2', 'sali3'];

/** Columna para drill-down. */
export const COLUMNA_DRILLDOWN_IMR = 'desc';

/** Todas las columnas que responden al clic en la tabla de Monitor IMR. */
export const COLUMNAS_CLICABLES_IMR = [COLUMNA_DRILLDOWN_IMR, ...COLUMNAS_CON_DETALLE_IMR];

/** Verifica si permite drill-down. */
export function permiteDrilldown(fila: Record<string, unknown>): boolean {
  return Number(fila['tip_cod']) !== 1;
}

/** Verifica si es fila de totales. */
export function esFilaTotal(fila: Record<string, unknown>): boolean {
  return Number(fila['style']) === 1;
}
