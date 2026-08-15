import type { TablaReporteResultado } from '../tabla-reporte.model';

/** Resultado de "Plan de Datos" (`PlanDatosService.obtenerPlanDatos`) — único bloque del legado (`P_Datos_02` — el `id` real es `_02`, no `_01`). */
export interface ReportePlanDatos {
  tabla1: TablaReporteResultado;
}

export interface OpcionFechaBase {
  id: string;
  desc: string;
}

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function formatoYYYYMMDD(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}${mes}${dia}`;
}

/**
 * Opciones del filtro real "Fecha Base" (legado `renderDates_3()`,
 * `filter-locale.module.ts`, variable `fec`) — los últimos 11 fin-de-mes
 * completos antes del mes actual, más "ayer" (el mes en curso, aunque no
 * haya terminado), de más reciente a más antiguo. El legado usa
 * `DateService.dataRange()` (moment.js); acá se reimplementa con `Date`
 * nativo, mismo resultado: `id` = fecha en `YYYYMMDD`, `desc` = "mes - año"
 * en español. Los 11 meses generados son siempre estrictamente anteriores al
 * mes de "ayer" (por construcción), así que nunca coinciden con él — no hace
 * falta deduplicar.
 */
export function generarOpcionesFechaBase(hoy: Date = new Date()): OpcionFechaBase[] {
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  const mesBase = new Date(ayer.getFullYear(), ayer.getMonth(), 1);

  const opciones: OpcionFechaBase[] = [{ id: formatoYYYYMMDD(ayer), desc: `${MESES_ES[ayer.getMonth()]} - ${ayer.getFullYear()}` }];
  for (let mesesAtras = 1; mesesAtras <= 11; mesesAtras++) {
    const finDeMes = new Date(mesBase.getFullYear(), mesBase.getMonth() - mesesAtras + 1, 0);
    opciones.push({ id: formatoYYYYMMDD(finDeMes), desc: `${MESES_ES[finDeMes.getMonth()]} - ${finDeMes.getFullYear()}` });
  }

  return opciones;
}

/** El legado selecciona `data[1]` tras invertir — el mes cerrado más reciente, no el mes en curso ("ayer", que queda en el índice 0). */
export function fechaBasePorDefecto(hoy: Date = new Date()): string {
  const opciones = generarOpcionesFechaBase(hoy);
  return opciones[1]?.id ?? opciones[0]?.id ?? '';
}
