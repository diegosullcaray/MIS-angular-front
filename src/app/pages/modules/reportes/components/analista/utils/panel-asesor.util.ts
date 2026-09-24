import type { ColumnaReporte, FilaReporte, TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type {
  BloquePanelAsesor,
  ClaveTabla,
  GrupoPanelAsesorDef,
  KpiPanelAsesor,
  ReportePanelAsesor,
  ResultadoPanelAsesor,
} from '../models/panel-asesor.model';

const CLAVES_TABLA: readonly ClaveTabla[] = ['tabla1', 'tabla2', 'tabla3', 'tabla4'];

/** Grupos ordenados por el tráfico total de sus reportes, y cada reporte por su propio tráfico. */
export function gruposOrdenados(
  grupos: readonly GrupoPanelAsesorDef[],
  reportes: readonly ReportePanelAsesor[],
): { grupo: GrupoPanelAsesorDef; reportes: ReportePanelAsesor[] }[] {
  return grupos
    .map((grupo) => {
      const propios = reportes.filter((r) => r.grupo === grupo.id).sort((a, b) => b.peticiones - a.peticiones);
      return { grupo, reportes: propios, total: propios.reduce((s, r) => s + r.peticiones, 0) };
    })
    .filter((g) => g.reportes.length > 0)
    .sort((a, b) => b.total - a.total)
    .map(({ grupo, reportes: propios }) => ({ grupo, reportes: propios }));
}

/** Bloques a pintar: los declarados que llegaron, o todas las tablas presentes en orden. */
export function bloquesDe(reporte: ReportePanelAsesor, resultado: ResultadoPanelAsesor): BloquePanelAsesor[] {
  const declarados = reporte.bloques ?? CLAVES_TABLA.map((tabla) => ({ tabla }));
  return declarados.filter((b) => resultado[b.tabla] !== undefined);
}

/** Vacío real: ni filas, ni series con datos, ni KPI. Un error nunca llega acá. */
export function sinDatos(resultado: ResultadoPanelAsesor): boolean {
  const tablas = CLAVES_TABLA.map((c) => resultado[c]).filter((t) => t !== undefined);
  const hayFilas = tablas.some((t) => t.body.length > 0);
  const haySeries = (resultado.graficos ?? []).some((g) => g.series.some((s) => s.datos.some((d) => d !== null)));
  const hayKpi = Boolean(resultado.kpiOperaciones?.cumpl_des_acum || resultado.kpiMonto?.cumpl_ope_acum);
  return !hayFilas && !haySeries && !hayKpi;
}

/** Columnas hoja con datos, en el orden en que las pinta `app-tabla-reporte`. */
export function columnasDato(tabla: TablaReporteResultado): ColumnaReporte[] {
  return tabla.headers
    .flatMap((fila) => (fila?.columns ?? []).filter((c): c is ColumnaReporte => c != null))
    .filter((c) => c.isdata != null)
    .sort((a, b) => (a.ordenPresentacion ?? a.isdata ?? 0) - (b.ordenPresentacion ?? b.isdata ?? 0));
}

/**
 * Encabezado de grupo de cada hoja en tablas de dos niveles ("Mes actual" › "Saldo").
 * Recorre la primera fila: una columna sin `isdata` agrupa las `cols` hojas siguientes.
 */
function gruposDeHojas(tabla: TablaReporteResultado, hojas: ColumnaReporte[]): Map<string, string> {
  const grupos = new Map<string, string>();
  if (tabla.headers.length < 2) return grupos;
  const primera = (tabla.headers[0]?.columns ?? []).filter((c): c is ColumnaReporte => c != null);
  const enPrimera = new Set(primera.map((c) => c.columnDef));
  const inferiores = hojas.filter((h) => !enPrimera.has(h.columnDef));
  let cursor = 0;
  for (const columna of primera) {
    if (columna.isdata != null) continue;
    const ancho = columna.cols ? Number(columna.cols) : 1;
    for (let i = 0; i < ancho && cursor < inferiores.length; i++, cursor++) {
      if (columna.header) grupos.set(inferiores[cursor].columnDef, columna.header);
    }
  }
  return grupos;
}

function etiquetas(tabla: TablaReporteResultado, hojas: ColumnaReporte[]): Map<string, string> {
  const grupos = gruposDeHojas(tabla, hojas);
  return new Map(
    hojas.map((h) => {
      const propia = h.header?.trim() || h.columnDef;
      const grupo = grupos.get(h.columnDef);
      return [h.columnDef, grupo ? `${grupo} · ${propia}` : propia];
    }),
  );
}

const esSemaforo = (c: ColumnaReporte) => c.format?.['type'] === 'traffic-light';
const esFilaTotal = (f: FilaReporte) => f['style'] === 1;

/** Número del motor: `number` tal cual, o texto estrictamente numérico. Lo demás no es cifra. */
export function aNumero(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor === 'string' && /^-?\d+(\.\d+)?$/.test(valor.trim())) return Number(valor.trim());
  return null;
}

/** Mismo formato que `app-tabla-reporte`, para que KPI y tabla muestren idéntica cifra. */
export function formatearValor(valor: unknown, columna: ColumnaReporte): string {
  if (valor === null || valor === undefined || valor === '') return '';
  switch (columna.format?.['type']) {
    case 'number':
      return typeof valor === 'number' ? new Intl.NumberFormat('es-PE').format(valor) : String(valor);
    case 'percent':
      return typeof valor === 'number'
        ? new Intl.NumberFormat('es-PE', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor)
        : String(valor);
    default:
      return String(valor);
  }
}

function semaforo(valor: unknown): 1 | 0 | -1 | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return n === 1 || n === 0 || n === -1 ? n : null;
}

/**
 * KPI de la fila de totales (`style === 1`), o de la única fila si el bloque trae una sola.
 * Sin una de esas dos, no hay total confiable y no se inventa uno sumando.
 */
export function kpisDeTotales(tabla: TablaReporteResultado | undefined, maximo = 4): KpiPanelAsesor[] {
  if (!tabla) return [];
  const fila = tabla.body.find(esFilaTotal) ?? (tabla.body.length === 1 ? tabla.body[0] : undefined);
  if (!fila) return [];
  const hojas = columnasDato(tabla);
  const nombres = etiquetas(tabla, hojas);
  return hojas
    .slice(1)
    .filter((c) => !esSemaforo(c) && aNumero(fila[c.columnDef]) !== null)
    .slice(0, maximo)
    .map((c) => ({
      etiqueta: nombres.get(c.columnDef) ?? c.columnDef,
      valor: formatearValor(fila[c.columnDef], c),
      semaforo: semaforo(fila[`style_${c.columnDef}`]),
    }));
}

/** Semáforo de las tarjetas KPI del monitor de desembolsos (`style_cumpl_*`). */
export function semaforoKpi(valor: unknown): 1 | 0 | -1 | null {
  return semaforo(valor);
}
