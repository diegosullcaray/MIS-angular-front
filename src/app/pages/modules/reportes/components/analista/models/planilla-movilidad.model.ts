import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/** Resultado combinado de "Planilla de Movilidad" (`PlanillaMovilidadService.obtenerPlanillaMovilidad`) — 4 bloques del legado (`PLANMOV_01/_02/_03/_04`), todos con el parámetro fijo `fec` (`fec_day_ult`, "ayer"). */
export interface ReportePlanillaMovilidad {
  tabla1: TablaReporteResultado;
  tabla2: TablaReporteResultado;
  tabla3: TablaReporteResultado;
  tabla4: TablaReporteResultado;
}

/** Criterios de depuración de puntos geolocalizados — mismo texto en las pestañas "Válidos" y "Depurados" del legado. */
export const CRITERIOS_MOVILIDAD: readonly string[] = [
  '(1) Coordenadas distintas por día (se aceptan hasta 4 decimales iguales)',
  '(2) Puntos geolocalizados en distintos a domingos y feriados',
  '(3) Puntos geolocalizados en días distintos de vacaciones ó licencias',
  '(4) Conversión de puntos a desplazamientos',
  '(5) Puntos dentro de la zona de influencia del asesor',
  '(6) Desplazamientos diarios no totalizan como mínimo 400mts',
];
