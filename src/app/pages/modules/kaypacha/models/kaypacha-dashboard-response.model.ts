import type { KaypachaColaboradorItem, KaypachaDatosUsuario } from './kaypacha-colaborador.model';

export interface KaypachaPuntos {
  HPUNTAFINAL?: string | number;
  HDESPOS?: string | number;
  HACTBOTON?: string;
}

export interface KaypachaResultadoRaw {
  cab1?: Array<{ JSONNHEAD1: string }>;
  cab1_1?: Array<{ JSONNHEAD1: string }>;
  res1?: unknown[];
  cab2?: Array<{ JSONNHEAD1: string }>;
  cab2_2?: Array<{ JSONNHEAD1: string }>;
  res2?: unknown[];
  puntos?: KaypachaPuntos;
  datosUsurio?: KaypachaDatosUsuario;
}

export interface KaypachaResponseBody {
  resultado?: KaypachaResultadoRaw | KaypachaColaboradorItem[];
}
