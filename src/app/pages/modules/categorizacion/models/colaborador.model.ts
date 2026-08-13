/**
 * Nodo crudo de `base_hier` (`ModSysAdminService`) — acá se necesita
 * `flag_1`, campo que el selector de jerarquía de Presupuesto no modela
 * porque nunca lo usa (ver `HierarquiaNodo`, `presupuesto/models`). Se
 * preserva el filtro del legado (`flag_1` en `{0,1,2}`) tal cual, sin poder
 * confirmar contra el backend real qué representa cada valor.
 */
export interface NodoJerarquiaAncla {
  tip_cod: number;
  cod_rel: string;
  desc_rel?: string;
  flag_1?: number;
}

/**
 * Ítem de `list_pick_01` — sectorista seleccionable en el buscador de un
 * admin/supervisor. Nombres de campo sin verificar contra el backend real
 * (ruta no usada por ningún otro módulo migrado); se asume el mismo patrón
 * `cod_sec`/`des_sec` que usa el resto del sistema.
 */
export interface SectoristaItem {
  cod_sec: string;
  des_sec: string;
}
