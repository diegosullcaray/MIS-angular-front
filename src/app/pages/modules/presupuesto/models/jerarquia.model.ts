/** Nodo del árbol jerárquico organizativo (`base_hier`/`level_hier` del backend Ant, módulo `admin` — ver `ModSysAdminService`). */
export interface HierarquiaNodo {
  tip_cod: number;
  cod_rel: string;
  desc_rel?: string;
  des_rel?: string;
  lbl_hier?: string;
  lvl?: number;
}

/** Estructura para cada desplegable p-select por nivel jerárquico. */
export interface NivelJerarquiaDropdown {
  label: string;
  level: number;
  data: HierarquiaNodo[];
}

/** Parámetros para pedir la jerarquía base de una pantalla. */
export interface ParamsJerarquia {
  /** `cod_jer` — código de la jerarquía organizativa a explorar. */
  code: number;
  /** Profundidad máxima de niveles que puede expandir el usuario. */
  maxLvl: number;
  /** Título del diálogo/selector (ej. "JERARQUIA ADMIN. COMER."). */
  dlgTitulo: string;
}
