import type { OpcionFiltro } from '../../../../../models/filtros.model';

/** `TIPOAgenteC()` del legado (`filter-locale.module.ts`): filtro `tip_age` de "Vista General" y "Gestión" de Corresponsal. */
export const OPCIONES_TIPO_AGENTE: OpcionFiltro[] = [
  { id: 'TODOS', desc: 'TODOS' },
  { id: '1', desc: 'Propio' },
  { id: '2', desc: 'Satelital' },
];
export const TIPO_AGENTE_POR_DEFECTO = 'TODOS';
