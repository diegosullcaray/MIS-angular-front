import { colorSerieReporte } from './paleta-colores.util';
import type { BloqueGrafico } from '../models/grafico-comun.model';

/** Forma cruda del payload de un bloque de gráfico del legado. */
interface DatosGraficoCrudo {
  categories?: string[];
  series?: { name?: string; data?: (number | null)[] }[];
}

/**
 * Las categorías y series de un bloque de gráfico, con el color corporativo ya
 * asignado a cada serie.
 *
 * El legado manda `{categories, series}` serializado en `headers`, sin colores.
 * Quien no asigne ninguno cae en el respaldo de `highcharts-factory.util.ts`,
 * que es una paleta de emergencia y no la de la Financiera: por eso Actividad
 * Diaria se veía con los colores del sistema viejo mientras Actividad Mensual
 * se veía bien.
 *
 * Esta función es la única que traduce ese payload. Los dos reportes la
 * comparten a propósito: mientras existieron dos copias, una tenía color y la
 * otra no, y nada impedía que volvieran a separarse.
 */
export function seriesDeGraficoConColor(headers: string | undefined): Pick<BloqueGrafico, 'categorias' | 'series'> {
  if (!headers) return { categorias: [], series: [] };

  let datos: DatosGraficoCrudo;
  try {
    datos = JSON.parse(headers) as DatosGraficoCrudo;
  } catch {
    // Un bloque con el payload roto es un bloque sin gráfico, no una pantalla caída.
    return { categorias: [], series: [] };
  }

  const series = datos.series ?? [];
  // Con una sola serie el color no distingue nada: va el azul de marca.
  const esUnica = series.length === 1;

  return {
    categorias: datos.categories ?? [],
    series: series.map((s) => ({
      nombre: s.name ?? '',
      datos: s.data ?? [],
      color: colorSerieReporte(s.name ?? '', esUnica),
    })),
  };
}
