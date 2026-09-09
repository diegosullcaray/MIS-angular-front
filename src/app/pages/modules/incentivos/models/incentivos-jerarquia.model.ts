/** Nodo de jerarquía organizativa listado en el selector de nivel. */
export interface NodoJerarquiaIncentivo {
  /** Lo consume `app-data-table`, que trabaja sobre filas indexables por su `field`. */
  [key: string]: unknown;
  tip_cod: number;
  cod_rel: string;
  des_rel: string;
  des_gru?: string;
  tip_rel?: string;
  cod_gru?: number;
}

/**
 * Colaborador listado en la sección Asesores del selector de nivel (`list_pick_01`).
 *
 * `des_uni`/`des_cor`/`des_ter` son la ubicación del asesor en la jerarquía
 * comercial: son las tres columnas que acompañan al nombre en el picker del
 * legado (`sec-picker-dialog.util.ts`), y el `cod_sec` no se muestra —solo
 * identifica la fila y viaja como `cod_rel` al elegirla.
 */
export interface AsesorPickItem {
  /** Lo consume `app-data-table`, que trabaja sobre filas indexables por su `field`. */
  [key: string]: unknown;
  cod_sec: string;
  des_sec: string;
  des_uni?: string;
  des_cor?: string;
  des_ter?: string;
  des_car?: string;
  pic_url?: string;
  cod_gru?: number;
}

/** Nivel habilitado en la navegación del selector de jerarquía. */
export interface NivelSelectorJerarquia {
  etiqueta: string;
  tipCodListado: number;
}
