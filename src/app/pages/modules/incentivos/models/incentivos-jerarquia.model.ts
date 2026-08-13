/** Nodo de jerarquía organizativa listado en el selector de nivel. */
export interface NodoJerarquiaIncentivo {
  tip_cod: number;
  cod_rel: string;
  des_rel: string;
  des_gru?: string;
  tip_rel?: string;
  cod_gru?: number;
}

/** Colaborador listado en la sección Asesores del selector de nivel. */
export interface AsesorPickItem {
  cod_sec: string;
  des_sec: string;
  des_car?: string;
  pic_url?: string;
  cod_gru?: number;
}

/** Nivel habilitado en la navegación del selector de jerarquía. */
export interface NivelSelectorJerarquia {
  etiqueta: string;
  tipCodListado: number;
}
