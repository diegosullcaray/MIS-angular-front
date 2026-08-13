/**
 * Nodo crudo de `base_hier` (`ModSysAdminService`) — necesita `flag_1`, igual
 * que en Categorización (`categorizacion/models`, mismo campo, copia
 * independiente por módulo).
 */
export interface NodoJerarquiaAncla {
  tip_cod: number;
  cod_rel: string;
  desc_rel?: string;
  flag_1?: number;
}

/** Ítem de `list_pick_01` — colaborador seleccionable en el buscador. */
export interface ColaboradorItem {
  cod_sec: string;
  des_sec: string;
}

/** Colaborador activo — el que se está mirando (uno mismo, o el elegido por un admin). */
export interface ColaboradorActivo {
  codBt: string;
  nombre: string;
}
