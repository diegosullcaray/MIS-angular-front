/**
 * Nodo del árbol jerárquico organizativo (`base_hier`/`level_hier` del backend
 * Ant, módulo `admin` — ver `ModSysAdminService`). El campo de descripción es
 * `desc_rel` (prefijo `desc_`, no `des_`) — igual que `list_sec` del mismo
 * módulo devuelve `desc_sec` (ver `MenuStgService`/`AntMenuItem`), no `des_sec`.
 * Antes se usaba `des_rel` (adivinado, sin verificar contra el backend real,
 * porque el componente legado `hier-rem-selector` que arma este árbol no
 * estaba en el volcado de referencia) — eso dejaba las etiquetas del árbol
 * vacías: el nodo se pintaba (por eso se podía seleccionar) pero sin texto.
 */
export interface HierarquiaNodo {
  tip_cod: number;
  cod_rel: string;
  desc_rel: string;
  lvl?: number;
}

/** Parámetros para pedir la jerarquía base de una pantalla "línea simple". */
export interface ParamsJerarquia {
  /** `cod_jer` — código de la jerarquía organizativa a explorar. */
  code: number;
  /** Profundidad máxima de niveles que puede expandir el usuario. */
  maxLvl: number;
  /** Título del diálogo/selector (ej. "JERARQUIA ADMIN. COMER."). */
  dlgTitulo: string;
}
