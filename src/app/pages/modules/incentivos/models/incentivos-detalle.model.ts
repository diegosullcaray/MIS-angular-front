/** Etiquetas de las tarjetas KPI y notas al pie del diálogo de detalle. */
export interface EtiquetasDetalle {
  tarjetas: [string, string, string];
  nota?: string;
}

/** Tarjetas KPI del diálogo de detalle. */
export interface CardDetalleVariable {
  cie_real: number;
  var_real: number;
  met: number;
  exis_met: number;
  avan: number;
  f1: string;
  f2: string;
  blocks: number;
}

/** Fila de la tabla de indicadores del detalle. */
export interface FilaVariableDetalle {
  des_var: string;
  cod_bdd?: number;
  cod_block: number;
  fmt?: string;
  f1?: number;
  f2?: number;
  diff?: number;
}

/** Fila de la tabla de ranking del detalle. */
export interface FilaRankingDetalle {
  des_rel: string;
  tip_cod: number;
  cod_rel: string;
  var_real: number;
  met: number;
  diff: number;
}

/** Objeto resultado completo del detalle de una variable. */
export interface ResultadoDetalleVariable {
  card: CardDetalleVariable;
  vars: FilaVariableDetalle[];
  rank: FilaRankingDetalle[];
}

/** Estado de un nivel navegable dentro del historial de drill-down de detalle. */
export interface FrameDetalle {
  tipCod: number;
  codRel: string;
  desRel: string;
  desLab: string;
  resultado: ResultadoDetalleVariable;
}

export type ReqDetalleVariable = 'getDetail' | 'getTasa' | 'getProd' | 'getRetencion';

/** Configuración del diálogo de detalle activo. */
export interface DetalleVariableActivo {
  titulo: string;
  icono: string;
  req: ReqDetalleVariable;
  codVar: number;
  card: boolean;
}
