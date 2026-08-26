import type { ParamsJerarquia } from '../../../../shared/ui/hier-selector/jerarquia.model';

// Los tipos viven junto a `<app-hier-selector>`, en shared; acá queda el catálogo de jerarquías
// de este módulo — el `getHierarchyConfig()` del legado (`mod-rep.service.ts`).
export type {
  HierarquiaNodo,
  JerarquiaResponseBody,
  NivelJerarquiaDropdown,
  ParamsJerarquia,
} from '../../../../shared/ui/hier-selector/jerarquia.model';

/** `cod_jer` de la jerarquía organizativa (`UNI_1` del legado) — mismo código que usan Presupuesto/Kaypacha/Incentivos para `base_hier`. */
export const COD_JERARQUIA_ORGANIZATIVA = 9;
/** Profundidad máxima de niveles de `UNI_1` — `getHierarchyConfig('UNI_1')` del legado. */
export const NIVEL_MAXIMO_JERARQUIA = 6;

/** `paramsHier` de `app-hier-selector` para la jerarquía organizativa — igual en todo reporte que la use. */
export const PARAMS_HIER_UNIDAD: ParamsJerarquia = {
  code: COD_JERARQUIA_ORGANIZATIVA,
  maxLvl: NIVEL_MAXIMO_JERARQUIA,
  dlgTitulo: 'JERARQUIA UNIDAD',
};

/** `cod_jer` de la jerarquía de oficinas/agencias — `OFI_1` del legado (`mod-rep.service.ts`: `{code:2, max_lvl:5}`, comentada como "captaciones"). */
export const COD_JERARQUIA_OFICINA = 2;
/** Profundidad máxima de `OFI_1` — `getHierarchyConfig('OFI_1').max_lvl` del legado. */
export const NIVEL_MAXIMO_JERARQUIA_OFICINA = 5;

/** `paramsHier` para la jerarquía de oficinas (`OFI_1`) — la usan los reportes de captaciones por agencia (ej. "CMG Captaciones - Agencias"). */
export const PARAMS_HIER_OFICINA: ParamsJerarquia = {
  code: COD_JERARQUIA_OFICINA,
  maxLvl: NIVEL_MAXIMO_JERARQUIA_OFICINA,
  dlgTitulo: 'JERARQUIA OFICINA',
};

/** `cod_jer` de la jerarquía "solo FC" — `OFI_3` del legado (`mod-rep.service.ts`: `{code:4, max_lvl:1}`). */
export const COD_JERARQUIA_FC = 4;
/** Profundidad máxima de `OFI_3`: un solo nivel, la propia Financiera. */
export const NIVEL_MAXIMO_JERARQUIA_FC = 1;

/** `paramsHier` para `OFI_3` — la usan los reportes de Seguimiento Banca Preferente, que no bajan de Financiera. */
export const PARAMS_HIER_FC: ParamsJerarquia = {
  code: COD_JERARQUIA_FC,
  maxLvl: NIVEL_MAXIMO_JERARQUIA_FC,
  dlgTitulo: 'JERARQUIA UNIDAD',
};

/**
 * `cod_jer` de la jerarquía de "Evolutivo Pasivos" — el legado la pide directo
 * con `iniHierarchy(14, 4)`, sin pasar por `getHierarchyConfig()`: no tiene
 * nombre simbólico (`UNI_*`/`OFI_*`) en `mod-rep.service.ts`.
 */
export const COD_JERARQUIA_SEGUROS_PASIVOS = 14;
/** Profundidad máxima de la jerarquía 14 — el segundo argumento de ese `iniHierarchy`. */
export const NIVEL_MAXIMO_JERARQUIA_SEGUROS_PASIVOS = 4;

/** `paramsHier` de la jerarquía 14 — solo la usa "Evolutivo Pasivos" (`repositorio/seguro-pasivos-graf`). */
export const PARAMS_HIER_SEGUROS_PASIVOS: ParamsJerarquia = {
  code: COD_JERARQUIA_SEGUROS_PASIVOS,
  maxLvl: NIVEL_MAXIMO_JERARQUIA_SEGUROS_PASIVOS,
  dlgTitulo: 'JERARQUIA UNIDAD',
};

/** `cod_jer` de la jerarquía macro de captaciones sin macrocorredor — `MAC_2` del legado (`mod-rep.service.ts`: `{code:13, max_lvl:3}`). */
export const COD_JERARQUIA_MACRO = 13;
/** Profundidad máxima de `MAC_2`. */
export const NIVEL_MAXIMO_JERARQUIA_MACRO = 3;

/** `paramsHier` para `MAC_2` — la usan "Panel Operaciones" y "Gestión Pasivo Comercial". */
export const PARAMS_HIER_MACRO: ParamsJerarquia = {
  code: COD_JERARQUIA_MACRO,
  maxLvl: NIVEL_MAXIMO_JERARQUIA_MACRO,
  dlgTitulo: 'JERARQUIA MACRO',
};
