import type { ParamsJerarquia } from '../../../../shared/ui/hier-selector/jerarquia.model';

// Los tipos viven junto a `<app-hier-selector>`, en shared; acá queda el catálogo de jerarquías
// de este módulo — el `getHierarchyConfig()` del legado (`mod-rep.service.ts`).
export type {
  HierarquiaNodo,
  JerarquiaResponseBody,
  NivelJerarquiaDropdown,
  ParamsJerarquia,
} from '../../../../shared/ui/hier-selector/jerarquia.model';

/** Código de jerarquía organizativa. */
export const COD_JERARQUIA_ORGANIZATIVA = 9;
/** Nivel máximo de jerarquía organizativa. */
export const NIVEL_MAXIMO_JERARQUIA = 6;

/** Parámetros de jerarquía organizativa. */
export const PARAMS_HIER_UNIDAD: ParamsJerarquia = {
  code: COD_JERARQUIA_ORGANIZATIVA,
  maxLvl: NIVEL_MAXIMO_JERARQUIA,
  dlgTitulo: 'JERARQUIA UNIDAD',
};

/** Código de jerarquía de oficina. */
export const COD_JERARQUIA_OFICINA = 2;
/** Nivel máximo de jerarquía de oficina. */
export const NIVEL_MAXIMO_JERARQUIA_OFICINA = 5;

/** Parámetros de jerarquía de oficina. */
export const PARAMS_HIER_OFICINA: ParamsJerarquia = {
  code: COD_JERARQUIA_OFICINA,
  maxLvl: NIVEL_MAXIMO_JERARQUIA_OFICINA,
  dlgTitulo: 'JERARQUIA OFICINA',
};

/** Código de jerarquía FC. */
export const COD_JERARQUIA_FC = 4;
/** Nivel máximo de jerarquía FC. */
export const NIVEL_MAXIMO_JERARQUIA_FC = 1;

/** Parámetros de jerarquía FC. */
export const PARAMS_HIER_FC: ParamsJerarquia = {
  code: COD_JERARQUIA_FC,
  maxLvl: NIVEL_MAXIMO_JERARQUIA_FC,
  dlgTitulo: 'JERARQUIA UNIDAD',
};

/** Código de jerarquía de seguros pasivos. */
export const COD_JERARQUIA_SEGUROS_PASIVOS = 14;
/** Nivel máximo de jerarquía de seguros pasivos. */
export const NIVEL_MAXIMO_JERARQUIA_SEGUROS_PASIVOS = 4;

/** Parámetros de jerarquía de seguros pasivos. */
export const PARAMS_HIER_SEGUROS_PASIVOS: ParamsJerarquia = {
  code: COD_JERARQUIA_SEGUROS_PASIVOS,
  maxLvl: NIVEL_MAXIMO_JERARQUIA_SEGUROS_PASIVOS,
  dlgTitulo: 'JERARQUIA UNIDAD',
};

/** Código de jerarquía macro. */
export const COD_JERARQUIA_MACRO = 13;
/** Profundidad máxima de `MAC_2`. */
export const NIVEL_MAXIMO_JERARQUIA_MACRO = 3;

/** Parámetros de jerarquía macro. */
export const PARAMS_HIER_MACRO: ParamsJerarquia = {
  code: COD_JERARQUIA_MACRO,
  maxLvl: NIVEL_MAXIMO_JERARQUIA_MACRO,
  dlgTitulo: 'JERARQUIA MACRO',
};

/** Alias para jerarquía macro sin corredor. */
export const PARAMS_HIER_MACRO_SIN_CORREDOR = PARAMS_HIER_MACRO;
