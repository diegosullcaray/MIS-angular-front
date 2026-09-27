import type { OpcionFiltro } from '../../../../../models/filtros.model';
export {
  OPCIONES_TRAMO,
  OPCIONES_PRODUCTO_EFECTIVIDADES as OPCIONES_PRODUCTO_REASIGNADO,
  OPCIONES_SI_NO,
  OPCIONES_TRAMO_DIAS_GESTION,
} from '../../../../../models/filtros.model';

/** `Mostrar_por()` del legado — variable `ver` de "Gestión de Cartera Reasignada". */
export const OPCIONES_MOSTRAR_POR: OpcionFiltro<number>[] = [
  { id: 0, desc: 'Operación' },
  { id: 1, desc: 'Saldo' },
];
export const MOSTRAR_POR_POR_DEFECTO = 0;

export { TODO } from '../../../../../models/filtros.model';
export {
  FILTROS_DETALLE_INICIALES,
  type FiltrosDetalleComunes,
} from '../../../../../models/detalle-efectividades.model';
export { paramsDetalleComunes } from '../../../../../utils/detalle-efectividades.util';
