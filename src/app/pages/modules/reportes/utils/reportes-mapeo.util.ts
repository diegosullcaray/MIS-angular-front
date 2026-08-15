import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { FilaReporte, TablaReporteResultado } from '../models/tabla-reporte.model';
import type { ReporteResponseBody } from '../models/reportes-api.model';
import type { ColumnaDinamica, TablaDinamicaResultado, TablaRegularResponseBody } from '../models/tabla-dinamica.model';
import type { BloqueGrafico } from '../models/grafico-reporte.model';

/**
 * Mapeo compartido de la respuesta cruda del motor de reportes "mixtos"
 * (`regularData`) a la forma que consume `app-tabla-reporte` — mismo mapeo
 * que antes vivía centralizado en `ReportesService.obtenerBloqueReporte()`,
 * ahora reutilizado por el service propio de cada componente para no
 * duplicar el `.pipe(map(...))` en cada uno.
 */
export function mapearBloqueReporte(r: IWinderResponse): TablaReporteResultado {
  const result = (r.body as ReporteResponseBody | null)?.result;
  return { headers: result?.headers ?? [], body: result?.body ?? [], additional: result?.additional ?? {} };
}

/** Mismo mapeo, para el motor `table.regular` (columnas dinámicas) — ver `mapearBloqueReporte()`. */
export function mapearTablaRegular(r: IWinderResponse): TablaDinamicaResultado {
  const resultado = (r.body as TablaRegularResponseBody | null)?.resultado;
  const columnas = resultado?.headers ? (JSON.parse(resultado.headers) as ColumnaDinamica[]) : [];
  return { columnas, filas: (resultado?.data as Record<string, unknown>[]) ?? [] };
}

/**
 * Filtro de texto libre sobre las filas de una tabla — legado `filter_input`
 * (`table-multiheader.component.html`: `applyFilter()`, búsqueda por
 * substring sobre todos los valores de la fila). Coincidencia parcial,
 * insensible a mayúsculas/minúsculas.
 */
export function filtrarFilas(filas: FilaReporte[], texto: string): FilaReporte[] {
  const termino = texto.trim().toLowerCase();
  if (!termino) return filas;
  return filas.filter((fila) => Object.values(fila).some((valor) => String(valor ?? '').toLowerCase().includes(termino)));
}

interface BloqueGraficoCrudo {
  graphName?: string;
  graphSubName?: string;
  categories?: { columnDef?: string[] }[];
  series?: { name?: string; data?: (number | null)[]; color?: string }[];
  getUnitGraph?: string;
}

/**
 * Mapeo del motor de gráficos (`graphicData`) — a diferencia de
 * `mapearBloqueReporte()`, `result` es un array de bloques, no uno solo (ver
 * `ModReportesService.getGraphicData()`). Nombres de campo tomados del
 * legado (`ReportCrsV2Component.renderGrafico()`/`GraphicService`):
 * `graphName`/`graphSubName`/`categories[0].columnDef`/`series`/`getUnitGraph`.
 */
export function mapearBloquesGrafico(r: IWinderResponse): BloqueGrafico[] {
  const result = ((r.body as { result?: BloqueGraficoCrudo[] } | null)?.result ?? []) as BloqueGraficoCrudo[];
  return result.map((bloque) => ({
    titulo: bloque.graphName ?? '',
    subtitulo: bloque.graphSubName,
    categorias: bloque.categories?.[0]?.columnDef ?? [],
    series: (bloque.series ?? []).map((s) => ({ nombre: s.name ?? '', datos: s.data ?? [], color: s.color })),
    tituloEjeY: bloque.getUnitGraph,
  }));
}
