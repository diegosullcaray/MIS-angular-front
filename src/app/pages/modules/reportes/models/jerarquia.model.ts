export interface HierarquiaNodo {
  tip_cod: number;
  cod_rel: string;
  desc_rel?: string;
  des_rel?: string;
  lbl_hier?: string;
  lvl?: number;
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
