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
