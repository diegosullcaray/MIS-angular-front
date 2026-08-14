/** Modelo del formulario de actualización — mismas preguntas y `variable`s del legado `crs-repro.component.ts` (`this.form`). */
export interface ReprogramacionForm {
  preg_01: string;
  preg_02: string;
  preg_03: number | null;
  preg_04: string;
}

export const REPROGRAMACION_FORM_VACIO: ReprogramacionForm = {
  preg_01: '',
  preg_02: '',
  preg_03: null,
  preg_04: '',
};

export interface OpcionReprogramacion<T = string> {
  id: T;
  desc: string;
}

/** "Cliente Contestó Teléfono Otorgado" */
export const OPCIONES_PREG_01: OpcionReprogramacion[] = [
  { id: 'SI', desc: 'SI' },
  { id: 'NO', desc: 'NO' },
  { id: 'WHATSAPP', desc: 'WHATSAPP' },
];

/** "Afectación de su Negocio" */
export const OPCIONES_PREG_02: OpcionReprogramacion[] = [
  { id: 'No Afectado', desc: 'No Afectado' },
  { id: 'Parcial', desc: 'Parcial' },
  { id: 'Total', desc: 'Total' },
];

/** "Mis Ventas Bajaron" */
export const OPCIONES_PREG_03: OpcionReprogramacion<number>[] = [
  { id: 0, desc: '0 %' },
  { id: 0.1, desc: '10 %' },
  { id: 0.2, desc: '20 %' },
  { id: 0.3, desc: '30 %' },
  { id: 0.4, desc: '40 %' },
  { id: 0.5, desc: '50 %' },
  { id: 0.6, desc: '60 %' },
  { id: 0.7, desc: '70 %' },
  { id: 0.8, desc: '80 %' },
  { id: 0.9, desc: '90 %' },
  { id: 1, desc: '100 %' },
];

/** "Está de Acuerdo con su Cronograma" */
export const OPCIONES_PREG_04: OpcionReprogramacion[] = [
  { id: 'Si Acepta Masiva', desc: 'Si Acepta Masiva' },
  { id: 'Desea reprogramación individual', desc: 'Desea reprogramación individual' },
  { id: 'Desea pagar su cuota antigua (Reversa)', desc: 'Desea pagar su cuota antigua (Reversa)' },
  { id: 'En evaluación', desc: 'En evaluación' },
];
