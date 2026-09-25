import type { OpcionFiltro } from '../../../../../models/filtros.model';

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

/** Una tarjeta del bloque `RS_CARD_ZCUO_01` del dashboard Cero Cuotas. */
export interface KpiCeroCuotas {
  etiqueta: string;
  actual: number;
  anterior: number;
  variacion: number;
  /** En tramos de mora, bajar es favorable; en saldos, subir lo es. */
  favorableCuandoBaja: boolean;
}
