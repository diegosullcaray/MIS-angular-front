import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/** Resultado de "Campaña Ágil" (`CampanaAgilService.obtenerCampanaAgil`) — único bloque del legado (`rda/sectorista/campania_agil/campana_agil_sec_01`). */
export interface ReporteCampanaAgil {
  tabla1: TablaReporteResultado;
}

export interface OpcionSemana {
  id: number;
  desc: string;
}

/** Filtro "Semana" del legado (`Semana01()`, `filter-locale.module.ts`) — variable `sem`, semana 1 por defecto. */
export const OPCIONES_SEMANA: OpcionSemana[] = [
  { id: 1, desc: 'Semana 1' },
  { id: 2, desc: 'Semana 2' },
  { id: 3, desc: 'Semana 3' },
  { id: 4, desc: 'Semana 4' },
];

export const SEMANA_POR_DEFECTO = 1;
