/** Nodo del árbol jerárquico organizativo (`base_hier`/`level_hier` del backend Ant, módulo `admin` — ver `ModSysAdminService`). */
export interface HierarquiaNodo {
  tip_cod: number;
  cod_rel: string;
  des_rel?: string;
  desc_rel?: string;
  lvl?: number;
  lbl_hier?: string;
  /** Nivel que devuelve el backend en `level_hierarchy`; los reportes paginados del legado lo reenvían tal cual. */
  lvl_hier?: number;
  [clave: string]: unknown;
}

/** Configuración de la jerarquía a recorrer — el `confHier` del legado (`cod_hier`, `max_lvl`, `dlg_tlt`). */
export interface ParamsJerarquia {
  code: number;
  maxLvl: number;
  dlgTitulo: string;
}

/** Un nivel del selector en cascada — opciones del `p-select` de ese nivel. */
export interface NivelJerarquiaDropdown {
  label: string;
  level: number;
  data: HierarquiaNodo[];
}

/** Cuerpo de las respuestas `base_hier` / `level_hier`. */
export interface JerarquiaResponseBody {
  base_hierarchy?: HierarquiaNodo[];
  level_hierarchy?: HierarquiaNodo[];
}
