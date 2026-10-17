import type { ParamsJerarquia } from '../../../../shared/ui/hier-selector/jerarquia.model';

export const TITULO_TABLERO = 'Tablero de Seguimiento';

/** `cod_rep` del tablero: lo ejecuta `mod_rep.com.RTABSEG01` con `tip_cod`, `cod_rel` y `fec`. */
export const COD_TABLERO_SEGUIMIENTO = 'TAB_SEG_01';

/** Jerarquía organizativa: el SP atiende asesor (1), coordinación (17), unidad (18), corredor (19), territorio (20) y financiera (7). */
export const PARAMS_HIER_TABLERO: ParamsJerarquia = { code: 9, maxLvl: 6, dlgTitulo: 'JERARQUIA UNIDAD' };

/** Misma jerarquía que usa Incentivos para listar asesores y niveles. */
export const COD_JERARQUIA_TABLERO = 9;
export const TIP_COD_ASESOR = 1;
export const TIP_COD_FINANCIERA = 7;
export const COD_FINANCIERA = '231';

/** Niveles que el administrador puede listar (`tip_cod_l` de `incentivos3.lista3`). */
export const NIVELES_SELECTOR_TABLERO = [
  { etiqueta: 'Unidades', tipCodListado: 18 },
  { etiqueta: 'Corredores', tipCodListado: 19 },
  { etiqueta: 'Territorios', tipCodListado: 20 },
];
