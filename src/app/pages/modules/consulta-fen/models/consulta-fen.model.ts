export type NivelRiesgoFen = 'Muy Alto' | 'Alto' | 'Medio' | 'Bajo' | 'Muy Bajo';

/** DTO confirmado por la pantalla legada de Consulta FEN. */
export interface FilaRiesgoFen extends Record<string, unknown> {
  cod_ubi: string;
  des_dep: string;
  des_prov: string;
  des_dist: string;
  exp_mas: NivelRiesgoFen;
  exp_inu: NivelRiesgoFen;
  exp_seq: NivelRiesgoFen;
  exp_pre: NivelRiesgoFen;
}

export interface ResultadoTablaFen {
  data?: unknown;
}

export interface RespuestaFenBody {
  resultado?: ResultadoTablaFen;
}

export interface PuntoMapaFen {
  lat: number;
  lng: number;
  precision: 'departamento';
}
