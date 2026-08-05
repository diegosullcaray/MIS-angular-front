export interface TableHeaderDef {
  label: string;
  key: string;
  style?: Record<string, string>;
}

export interface KaypachaColaboradorItem {
  cod_bt: string;
  num_doc?: string;
  des_col: string;
  HCOLCAR: string;
  RCODCOL: string;
  pk?: number;
}

export interface KaypachaDatosUsuario {
  HDESPER?: string;
  HDESCAR?: string;
}

export interface KaypachaPuntos {
  HPUNTAFINAL?: string | number;
  HDESPOS?: string | number;
  HACTBOTON?: string;
}

export interface KaypachaResultadoRaw {
  cab1?: Array<{ JSONNHEAD1: string }>;
  cab1_1?: Array<{ JSONNHEAD1: string }>;
  res1?: any[];
  cab2?: Array<{ JSONNHEAD1: string }>;
  cab2_2?: Array<{ JSONNHEAD1: string }>;
  res2?: any[];
  puntos?: KaypachaPuntos;
  datosUsurio?: KaypachaDatosUsuario;
}

export interface KaypachaResponseBody {
  resultado?: KaypachaResultadoRaw | KaypachaColaboradorItem[];
}
