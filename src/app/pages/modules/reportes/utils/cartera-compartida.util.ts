import { filasDeResultado, resultadoCrudo } from './reportes-mapeo.util';
import type { ColumnaDinamica, TablaRegularResultadoRaw } from '../models/tabla-dinamica.model';
import { seriesDeGraficoConColor } from '../../../../shared/ui/graficos/utils/series-grafico.util';
import {
  GRAFICOS_AGRICOLA,
  TOTALES_AGRO,
  type DetalleAgricolaResultado,
  type TotalAgro,
} from '../models/cartera-agricola.model';
import { SEMAFOROS_CMG_CARTERA } from '../constantes/cmg-cartera.constantes';

/** `meta1` agrícola puede llegar como JSON o como arreglo. */
export function metaAgricolaDe(
  resultado: TablaRegularResultadoRaw | undefined,
): Record<string, unknown>[] | undefined {
  const meta = resultado?.meta1;
  return (typeof meta === 'string' ? JSON.parse(meta) : meta) as
    Record<string, unknown>[] | undefined;
}

/** El legado descarta las columnas que el backend marca como ocultas. */
export function columnasVisibles(headers: string | undefined): ColumnaDinamica[] {
  if (!headers) return [];
  const todas = JSON.parse(headers) as (ColumnaDinamica & { cellStyle?: { display?: string } })[];
  return todas.filter((h) => h.cellStyle?.display?.toLowerCase() !== 'none');
}

/** Relaciona cada columna visible de CMG con su semáforo oculto. */
export function conColumnasSemaforo(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
  return columnas.map((c) =>
    SEMAFOROS_CMG_CARTERA[c.key] ? { ...c, semaforoKey: SEMAFOROS_CMG_CARTERA[c.key] } : c,
  );
}

/** Valores del encabezado agrícola frente al mes anterior. */
export function totalesAgro(
  primeraFila: Record<string, unknown>,
  mesAnterior: Record<string, unknown>,
): TotalAgro[] {
  return TOTALES_AGRO.map(({ clave, etiqueta, formato }) => {
    const actual = Number(primeraFila[clave] ?? 0);
    const anterior = Number(mesAnterior[clave] ?? 0);
    return { etiqueta, formato, actual, anterior, senal: Math.sign(actual - anterior) };
  });
}

/** Gráficos y filas del detalle por cultivo de diaria y mensual. */
export function detalleAgricolaDe(respuestas: { body?: unknown }[]): DetalleAgricolaResultado {
  const filasPorGrafico: Record<string, Record<string, unknown>[]> = {};
  const graficos = respuestas.map((r, i) => {
    const { titulo, id } = GRAFICOS_AGRICOLA[i];
    const resultado = resultadoCrudo(r);
    if (id) filasPorGrafico[id] = filasDeResultado(resultado);
    return { titulo, ...seriesDeGraficoConColor(resultado?.headers) };
  });
  return { graficos, filasPorGrafico };
}
