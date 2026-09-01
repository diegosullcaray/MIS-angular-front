import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { FilaReporte, TablaReporteResultado } from '../models/tabla-reporte.model';
import type { ReporteResponseBody } from '../models/reportes-api.model';
import type {
  ColumnaDinamica,
  KpiTablaDinamica,
  TablaDinamicaResultado,
  TablaRegularResponseBody,
  TablaRegularResultadoRaw,
} from '../models/tabla-dinamica.model';
import type { BloqueGrafico } from '../../../../shared/ui/graficos/models/grafico-comun.model';
import type { OpcionFiltro } from '../../../../shared/ui/formularios/opcion-filtro.model';

/** Mapeo compartido de la respuesta cruda del motor de reportes "mixtos" (`regularData`) a la forma que consume `app-tabla-reporte` — mismo mapeo que antes vivía centralizado en `ReportesService.obtenerBloqueReporte()`, ahora reutilizado por el service propio de cada componente para no duplicar el `.pipe(map(...))` en cada uno. */
export function mapearBloqueReporte(r: IWinderResponse): TablaReporteResultado {
  const result = (r.body as ReporteResponseBody | null)?.result;
  return { headers: result?.headers ?? [], body: result?.body ?? [], additional: result?.additional ?? {} };
}

/** Mismo mapeo, para el motor `table.regular` (columnas dinámicas) — ver `mapearBloqueReporte()`. */
export function mapearTablaRegular(r: IWinderResponse): TablaDinamicaResultado {
  const body = (typeof r?.body === 'string' ? seguroParse<TablaRegularResponseBody>(r.body) : r?.body) as
    | TablaRegularResponseBody
    | null
    | undefined;
  const resultado = typeof body?.resultado === 'string' ? seguroParse<TablaRegularResultadoRaw>(body.resultado) : body?.resultado;

  let columnas: ColumnaDinamica[] = [];
  if (Array.isArray(resultado?.headers)) {
    columnas = resultado.headers as ColumnaDinamica[];
  } else if (typeof resultado?.headers === 'string') {
    columnas = seguroParse<ColumnaDinamica[]>(resultado.headers) ?? [];
  }

  const filas = (resultado?.data as Record<string, unknown>[]) ?? [];
  const kpis = mapearKpis(resultado, filas);
  return kpis ? { columnas, filas, kpis } : { columnas, filas };
}

/** Clave de la variación de cada producto dentro de la fila total — legado `carterizacion-cap-com.component.ts` (`varKey`). */
const CLAVE_VARIACION: Record<string, string> = {
  AHORROS: 'var-ahorros',
  'PLAZO FIJO': 'var-DPF',
  CTS: 'var-CTS',
};

/** Tarjetas KPI de `resultado.meta1`: el saldo sale del propio `meta1` y la variación del mes, de la primera fila (la de totales). */
function mapearKpis(resultado: TablaRegularResultadoRaw | undefined, filas: Record<string, unknown>[]): KpiTablaDinamica[] | undefined {
  if (!resultado?.meta1?.length) return undefined;

  const crudos = typeof resultado.meta1 === 'string' ? (JSON.parse(resultado.meta1) as Record<string, unknown>[]) : resultado.meta1;
  const total = filas[0] ?? {};

  return crudos.map((kpi) => {
    const producto = String(kpi['PRODUCTO'] ?? '');
    return {
      producto,
      saldo: Number(kpi['HSBSDO1'] ?? 0),
      variacion: Number(total[CLAVE_VARIACION[producto.toUpperCase()] ?? ''] ?? 0),
    };
  });
}

/**
 * Opciones del selector de periodo de los reportes del repositorio — bloques
 * `RS_FECH` / `RS_FECH02` del legado (`loadFilter()`).
 *
 * El bloque no devuelve una tabla: la lista viaja como JSON serializado dentro
 * de `resultado.meta1[0].json_result`, con la forma `{ label, val }` (el `val`
 * es la fecha de corte que después reemplaza a la del usuario).
 *
 * Devuelve `[]` ante cualquier payload que no se pueda leer: el legado hace lo
 * mismo (`catch` → `filter1 = []`) y así el reporte se queda con su corte por
 * defecto en vez de romperse.
 */
export function mapearPeriodos(r: IWinderResponse): OpcionFiltro[] {
  const meta1 = (r.body as TablaRegularResponseBody | null)?.resultado?.meta1;
  const filas = typeof meta1 === 'string' ? seguroParse<Record<string, unknown>[]>(meta1) : meta1;
  const json = filas?.[0]?.['json_result'];
  if (typeof json !== 'string') return [];

  const opciones = seguroParse<{ label?: string; text?: string; val?: string }[]>(json);
  if (!Array.isArray(opciones)) return [];

  return opciones
    .filter((o) => typeof o?.val === 'string' && o.val !== '')
    .map((o) => ({ id: o.val as string, desc: o.label ?? o.text ?? (o.val as string) }));
}

function seguroParse<T>(texto: string): T | undefined {
  try {
    return JSON.parse(texto) as T;
  } catch {
    return undefined;
  }
}

/** Filtro de texto libre sobre las filas de una tabla — legado `filter_input` (`table-multiheader.component.html`: `applyFilter()`, búsqueda por substring sobre todos los valores de la fila). */
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

/** Mapeo del motor de gráficos (`graphicData`) — a diferencia de `mapearBloqueReporte()`, `result` es un array de bloques, no uno solo (ver `ModReportesService.getGraphicData()`). */
export function mapearBloquesGrafico(r: IWinderResponse): BloqueGrafico[] {
  const result = ((r.body as { result?: BloqueGraficoCrudo[] } | null)?.result ?? []) as BloqueGraficoCrudo[];
  return result.map((bloque) => {
    let subtitulo = bloque.graphSubName;
    const series = (bloque.series ?? []).map((s) => ({ nombre: s.name ?? '', datos: s.data ?? [], color: s.color }));
    if (!subtitulo && series.length > 0) {
      const lineas: string[] = [];
      series.forEach((s) => {
        const ultimos = (s.datos ?? []).filter((d): d is number => d !== null && d !== undefined);
        if (ultimos.length > 0) {
          const ultimo = ultimos[ultimos.length - 1];
          const unit = (bloque.getUnitGraph ?? '').toLowerCase().includes('porcentaje') || s.nombre.includes('%') ? '%' : '';
          const numFmt = typeof ultimo === 'number'
            ? (unit ? `${ultimo.toFixed(1)}%` : ultimo.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }))
            : String(ultimo);
          lineas.push(`<span style="color:#15803d; font-weight:bold;">${s.nombre}:&nbsp;&nbsp;${numFmt}</span>`);
        }
      });
      if (lineas.length > 0) {
        subtitulo = lineas.join('<br>');
      }
    }
    return {
      titulo: bloque.graphName ?? '',
      subtitulo,
      categorias: bloque.categories?.[0]?.columnDef ?? [],
      series,
      tituloEjeY: bloque.getUnitGraph,
    };
  });
}

/** El `resultado` crudo de una respuesta del motor `table.regular`, sin mapear. */
export function resultadoCrudo(r: { body?: unknown }): TablaRegularResultadoRaw | undefined {
  return (r.body as { resultado?: TablaRegularResultadoRaw } | null)?.resultado;
}

/** Tabla cuyas cabeceras vienen serializadas en el propio payload. */
export function tablaDeResultado(resultado: TablaRegularResultadoRaw | undefined): TablaDinamicaResultado {
  return {
    columnas: resultado?.headers ? (JSON.parse(resultado.headers) as ColumnaDinamica[]) : [],
    filas: (resultado?.data ?? []) as Record<string, unknown>[],
  };
}

/** Las filas de un `resultado` crudo, ya tipadas. */
export function filasDeResultado(resultado: TablaRegularResultadoRaw | undefined): Record<string, unknown>[] {
  return (resultado?.data ?? []) as Record<string, unknown>[];
}
