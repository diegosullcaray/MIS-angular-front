/** Variable editable en la Calculadora de simulación. */
export interface VariableCalculadora {
  id: string;
  des: string;
  icono: string;
  formato: 'number' | 'percent';
  key: string;
  bob: number;
  bop: number;
  met: number;
  val: number;
  show: boolean;
  tp1?: number;
  tp2?: number;
  tp3?: number;
}

/** Ítem Plus editable en la Calculadora. */
export interface PlusCalculadora {
  id: string;
  des: string;
  icono: string;
  formato: 'number' | 'percent';
  key: string;
  val: number;
  val1?: number;
  met?: number;
  bos: number;
  enab: boolean;
  show: boolean;
  suma: boolean;
}

/** Estado completo de la Calculadora de simulación. */
export interface CalculadoraConfig {
  variables: VariableCalculadora[];
  plus: PlusCalculadora[];
  bonoBase: number;
  bonoPlus: number;
  bonoSuperPlus: number;
  bonoTotal: number;
  activo: number;
  margenRenovacion: number;
  claseUsuario: number;
}
