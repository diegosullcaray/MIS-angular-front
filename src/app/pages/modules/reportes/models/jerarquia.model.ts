export interface HierarquiaNodo {
  tip_cod: number;
  cod_rel: string;
  desc_rel?: string;
  des_rel?: string;
  lbl_hier?: string;
  lvl?: number;
  /** Nivel que devuelve el backend en `level_hierarchy`; los reportes paginados del legado lo reenvían tal cual. */
  lvl_hier?: number;
}

export interface ParamsJerarquia {
  code: number;
  maxLvl: number;
  dlgTitulo: string;
}

/** Un nivel del selector en cascada de `HierSelectorComponent` — opciones del `p-select` de ese nivel + su selección. */
export interface NivelJerarquiaDropdown {
  label: string;
  level: number;
  data: HierarquiaNodo[];
}

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
