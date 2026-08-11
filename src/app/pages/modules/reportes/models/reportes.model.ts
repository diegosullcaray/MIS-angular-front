export interface HierarquiaNodo {
  tip_cod: number;
  cod_rel: string;
  desc_rel?: string;
  des_rel?: string;
  lbl_hier?: string;
  lvl?: number;
}

export interface ParamsJerarquia {
  code: number;
  maxLvl: number;
  dlgTitulo: string;
}

export interface FilaEncabezadoColumna {
  columnDef: string;
  header: string;
  cols?: number;
  rows?: number;
  isdata?: number;
  format?: Record<string, unknown>;
  style?: Record<string, string>;
}

export type ColumnaReporte = FilaEncabezadoColumna;

export interface FilaEncabezadoReporte {
  columns: FilaEncabezadoColumna[];
}

export type FilaReporte = Record<string, unknown>;

export interface TablaReporteResultado {
  headers: FilaEncabezadoReporte[];
  body: FilaReporte[];
  additional: Record<string, unknown>;
}

export interface KpiOperacionesDesembolsadas {
  fecha?: string;
  hora?: string;
  cumpl_des_acum?: string;
  style_cumpl_des_acum?: string;
}

export interface KpiMontoDesembolsado {
  cumpl_ope_acum?: string;
  style_cumpl_ope_acum?: string;
}

export interface OpcionTipoMonRep {
  id: 1 | 2;
  desc: string;
}

export const OPCIONES_TIPO_MON_REP: OpcionTipoMonRep[] = [
  { id: 1, desc: 'Operaciones' },
  { id: 2, desc: 'Saldo' },
];
