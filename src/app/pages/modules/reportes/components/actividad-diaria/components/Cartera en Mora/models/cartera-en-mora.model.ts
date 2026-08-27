import type { OpcionFiltro } from '../../../../../models/filtros.model';
import type { ColumnaDinamica } from '../../../../../models/tabla-dinamica.model';

/**
 * Catálogos de filtro de "Cartera en Mora", tal como los declara el legado.
 *
 * Los que este módulo comparte con Portafolio Reasignado (`Tramo01()`,
 * `Producto01()`, `Boolean01()`, `TramoVenc01()`) NO se duplican acá: se
 * importan de `Portafolio Reasignado/models`, que ya los tenía migrados. Es el
 * mismo criterio con el que Cartera importa `ReporteBloqueUnico` de
 * Captaciones — el catálogo es del legado, no del módulo que lo estrena.
 */

/** `precosecha01()` del legado — variable `precosechaf` del bloque `_02` de "Monitor Efectividades". */
export const OPCIONES_PRECOSECHA: OpcionFiltro[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: '3', desc: '3 Meses' },
  { id: '6', desc: '6 Meses' },
];

/** `VariableNIngreso()` del legado — variable `tipcuota` de "Cuadro de Mando" y "Top". */
export const OPCIONES_TIPO_CUOTA: OpcionFiltro[] = [
  { id: '1', desc: 'Total' },
  { id: '2', desc: 'Nuevo Ingreso' },
  { id: '3', desc: 'Mantiene' },
];
export const TIPO_CUOTA_POR_DEFECTO = '1';

/**
 * `VariableNIngresoD()` del legado — el mismo `tipcuota` pero con OTRO juego de
 * ids, el que espera "Base de Gestión". No son intercambiables con los de
 * `OPCIONES_TIPO_CUOTA`: acá el backend filtra por el texto, no por el índice.
 */
export const OPCIONES_TIPO_CUOTA_BASE: OpcionFiltro[] = [
  { id: 'TODO', desc: 'TODO' },
  { id: 'Nuevo', desc: 'Nuevo Ingreso' },
  { id: 'Mantiene', desc: 'Mantiene' },
];
export const TIPO_CUOTA_BASE_POR_DEFECTO = 'TODO';

/**
 * `VariableProductNIngreso()` del legado — variable `prod` de "Cuadro de Mando".
 *
 * Ojo: manda el índice del producto, no su nombre (al revés que el `Producto01()`
 * que usan Monitor Efectividades y Portafolio Reasignado). Los ids comentados en
 * el legado se dejan fuera a propósito.
 */
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

/** `filter1` de `principal.util.ts` — variable `imp` de Monitor IMR. */
export const OPCIONES_IMPULSA_IMR: OpcionFiltro<number>[] = [
  { id: 1, desc: 'Total' },
  { id: 2, desc: 'Sin Impulsa' },
];
export const IMPULSA_IMR_POR_DEFECTO = 1;

/** Una tarjeta del encabezado de Monitor IMR, tal como la manda `mon_imr.resultados`. */
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
  /** Encabezados de la tabla: a diferencia de Monitor Salidas, acá los manda el backend. */
  columnas: ColumnaDinamica[];
}

export const RESULTADO_IMR_VACIO: ResultadoImr = { cards: [], table: [], columnas: [] };

/**
 * `tip` de `mon_imr.detalle` según la tarjeta/columna que se abrió — legado
 * `lista-clientes.component.ts` (`fs = 1..5`).
 */
export const TIPO_DETALLE_IMR: Record<string, number> = { sali1: 1, sali2: 2, sali3: 3, sali4: 4, sali5: 5 };

/** Título del detalle según esa misma métrica — legado `detalle-base.component.ts`. */
export const TITULO_DETALLE_IMR: Record<string, string> = {
  sali1: 'IMR en el Mes',
  sali2: 'Entradas',
  sali3: 'Salidas',
  sali4: 'Salidas hasta s/600',
  sali5: 'Salidas mayor a s/600',
};


/**
 * Columnas del listado de clientes del detalle — legado `lista-clientes.util.ts`
 * (`headers1`; el `headers2` quedó comentado en el componente, que siempre usa el primero).
 */
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

/** Cuántos clientes trae el detalle; el legado arranca en 10 y deja cambiarlo. */
export const TOPES_DETALLE_IMR = [10, 25, 50, 100];
export const TOPE_DETALLE_IMR_POR_DEFECTO = 10;

/**
 * Solo estas dos columnas abren el listado de clientes al hacer clic en la
 * tabla — legado `ddEvent()`, que filtra por `sali2`/`sali3` y descarta las
 * filas de total (`style === 1`).
 */
export const COLUMNAS_CON_DETALLE_IMR = ['sali2', 'sali3'];

/**
 * La columna de descripción NO abre el detalle: baja un nivel en la jerarquía
 * — legado `ddEvent()` → `ddHier(row)`, que recarga el reporte en ese nodo.
 */
export const COLUMNA_DRILLDOWN_IMR = 'desc';

/** Todas las columnas que responden al clic en la tabla de Monitor IMR. */
export const COLUMNAS_CLICABLES_IMR = [COLUMNA_DRILLDOWN_IMR, ...COLUMNAS_CON_DETALLE_IMR];

/**
 * El legado corta el drill-down en `tip_cod === 1` (Financiera): desde ahí no
 * se baja más.
 */
export function permiteDrilldown(fila: Record<string, unknown>): boolean {
  return Number(fila['tip_cod']) !== 1;
}

/** Las filas de total del legado vienen marcadas con `style === 1` y no son navegables. */
export function esFilaTotal(fila: Record<string, unknown>): boolean {
  return Number(fila['style']) === 1;
}
