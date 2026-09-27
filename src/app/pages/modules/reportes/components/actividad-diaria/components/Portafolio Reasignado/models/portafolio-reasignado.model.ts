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

/** Valor "sin filtrar" que comparten los filtros del detalle. */
export const TODO = 'TODO';

/**
 * Los filtros que comparten las pestañas de detalle de los dos reportes del
 * host `cra-v11`/`cra-v12`, con los mismos valores por defecto del legado.
 */
export interface FiltrosDetalleComunes {
  /** `nom` — el legado lo manda entre comodines (`%texto%`). */
  asesor: string;
  /** `fcompro` — `TODO` o la fecha en `dd/MM/yyyy`. */
  fechaCompromiso: Date | null;
  /** `resp` — opciones que trae `SEL_EFEC_01`. */
  ultimaGestion: string;
  /** `pagen`, empezando en 1. */
  pagina: number;
}

export const FILTROS_DETALLE_INICIALES: FiltrosDetalleComunes = {
  asesor: '',
  fechaCompromiso: null,
  ultimaGestion: TODO,
  pagina: 1,
};

/** Traduce los filtros comunes a los parámetros exactos que espera el backend. */
export function paramsDetalleComunes(f: FiltrosDetalleComunes): Record<string, unknown> {
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  const fecha = f.fechaCompromiso;
  return {
    pagen: f.pagina,
    nom: `%${f.asesor}%`,
    resp: f.ultimaGestion,
    fcompro: fecha ? `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}` : TODO,
  };
}
