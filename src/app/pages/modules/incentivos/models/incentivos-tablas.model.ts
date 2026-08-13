/** Parámetros que identifican qué diálogo de detalle abrir. */
export interface ParametrosDetalle {
  comp: 1 | 2;
  req: 'getDetail' | 'getTasa' | 'getProd' | 'getCliBanc' | 'getRetencion';
  card: boolean;
  typ?: 'cv' | 'sp';
}

/** Ítem del semáforo de variables del perfil. */
export interface ItemSemaforo {
  id: string;
  des: string;
  icono: string;
  val: number;
  show: boolean;
}

/** Ítem de la grilla de avances. */
export interface ItemAvance {
  id: string;
  des: string;
  icono: string;
  val: number;
  per: number;
  sit: number;
  show: boolean;
  enab: boolean;
}

/** Ítem de la grilla de Super Plus. */
export interface ItemSuperPlus {
  id: string;
  des: string;
  icono: string;
  val: number;
  show: boolean;
  enab: boolean;
  estado: number;
  parametros: ParametrosDetalle;
}

/** Estado del panel de monetización. */
export interface MonetizadoIncentivo {
  bonoBase: number;
  bonoPlus: number;
  bonoSuperPlus: number;
  bonoTotal: number;
  codigoSituacion: number;
  descripcionSituacion: string;
  puedeSimular: boolean;
  modelo: string;
  modeloDescripcion: string;
  mostrarModelo: boolean;
  fechasHabilitadas: string[];
}

/** Fila de la tabla de variables del Cuadro de Mando. */
export interface FilaTablaVariable {
  cod_var: number;
  ini_n?: number;
  cie_n?: number;
  cie_n_o?: number;
  cie_n_d?: number;
  var_real?: number;
  met?: number;
  mon?: number;
  avan_fix?: number;
}

/** Fila de la tabla de efectividad del Cuadro de Mando. */
export interface FilaTablaEfectividad {
  cod_var: number;
  ini?: number;
  man_efe?: number;
  rec?: number;
  efec?: number;
  met?: number;
  mon?: number;
  avan_fix?: number;
}
