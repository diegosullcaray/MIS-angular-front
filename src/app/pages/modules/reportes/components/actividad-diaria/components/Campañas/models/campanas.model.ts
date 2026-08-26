import type { OpcionFiltro } from '../../../../../models/filtros.model';

/** `filter1` de `agenda-comercial.util.ts` — variable `fuga` de "Agendamiento". */
export const OPCIONES_NIVEL_FUGA: OpcionFiltro<number>[] = [
  { id: 0, desc: 'Todos' },
  { id: 1, desc: 'Nivel de fuga Alto' },
  { id: 2, desc: 'Nivel de fuga Medio' },
  { id: 3, desc: 'Nivel de fuga Bajo' },
];

/** `filter2` del mismo util — variable `prop`. */
export const OPCIONES_NIVEL_PROPENSION: OpcionFiltro<number>[] = [
  { id: 0, desc: 'Todos' },
  { id: 1, desc: 'Nivel de Prop Alto' },
  { id: 2, desc: 'Nivel de Prop Medio' },
  { id: 3, desc: 'Nivel de Prop Bajo' },
];

/** `filter3` del mismo util — variable `nom`, el rango temporal del detalle. */
export const OPCIONES_RANGO_AGENDA: OpcionFiltro<number>[] = [
  { id: 0, desc: 'Todos' },
  { id: 1, desc: 'Esta Semana' },
  { id: 2, desc: 'Semana Anterior' },
  { id: 3, desc: 'Este Mes' },
];

export const FILTRO_AGENDA_POR_DEFECTO = 0;
