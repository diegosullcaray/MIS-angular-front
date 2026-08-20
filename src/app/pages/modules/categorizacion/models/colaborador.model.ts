/** Nodo crudo de `base_hier` (`ModSysAdminService`) — acá se necesita `flag_1`, campo que el selector de jerarquía de Presupuesto no modela porque nunca lo usa (ver `HierarquiaNodo`, `presupuesto/models`). */
export interface NodoJerarquiaAncla {
  tip_cod: number;
  cod_rel: string;
  desc_rel?: string;
  flag_1?: number;
}

/** Ítem de `list_pick_01` — sectorista seleccionable en el buscador de un admin/supervisor. */
export interface SectoristaItem {
  cod_sec: string;
  des_sec: string;
}
