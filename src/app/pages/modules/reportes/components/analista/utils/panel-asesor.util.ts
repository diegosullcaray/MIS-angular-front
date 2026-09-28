import { TABLA_PENDIENTE, type ColumnaReporte, type TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type {
  BloquePanelAsesor,
  ClaveTabla,
  GrupoPanelAsesorDef,
  ReportePanelAsesor,
  ResultadoPanelAsesor,
} from '../models/panel-asesor.model';

const CLAVES_TABLA: readonly ClaveTabla[] = ['tabla1', 'tabla2', 'tabla3', 'tabla4', 'tabla5'];

/** Grupos ordenados por el tráfico total de sus reportes, y cada reporte por su propio tráfico. */
export function gruposOrdenados(
  grupos: readonly GrupoPanelAsesorDef[],
  reportes: readonly ReportePanelAsesor[],
): { grupo: GrupoPanelAsesorDef; reportes: ReportePanelAsesor[] }[] {
  return grupos
    .map((grupo) => {
      const propios = reportes
        .filter((r) => r.grupo === grupo.id)
        .sort((a, b) => b.peticiones - a.peticiones);
      return { grupo, reportes: propios, total: propios.reduce((s, r) => s + r.peticiones, 0) };
    })
    .filter((g) => g.reportes.length > 0)
    .sort((a, b) => b.total - a.total)
    .map(({ grupo, reportes: propios }) => ({ grupo, reportes: propios }));
}

/** Bloques a pintar: los declarados que llegaron, o todas las tablas presentes en orden. */
export function bloquesDe(
  reporte: ReportePanelAsesor,
  resultado: ResultadoPanelAsesor,
): BloquePanelAsesor[] {
  const declarados: readonly BloquePanelAsesor[] =
    reporte.bloques ?? CLAVES_TABLA.map((tabla) => ({ tabla }));
  const presentes = declarados.filter((b) => resultado[b.tabla] !== undefined);
  // Toda tabla lleva nombre en su chip. El legado no titula muchas: sin título propio va el del
  // reporte, numerado si hay varias sin nombre. No se inventa un nombre de negocio.
  const sinTitulo = presentes.filter((b) => !b.titulo);
  return presentes.map((b) => {
    if (b.titulo) return b;
    const orden = sinTitulo.indexOf(b) + 1;
    return {
      ...b,
      titulo:
        sinTitulo.length > 1
          ? `${reporte.nombre} · ${orden} de ${sinTitulo.length}`
          : reporte.nombre,
    };
  });
}

/** Vacío real: ni filas, ni series con datos, ni KPI. Un error nunca llega acá. */
export function sinDatos(resultado: ResultadoPanelAsesor): boolean {
  const tablas = CLAVES_TABLA.map((c) => resultado[c]).filter((t) => t !== undefined);
  // Una tabla que todavía no respondió puede traer filas: no es "sin datos".
  if (tablas.some((t) => t === TABLA_PENDIENTE)) return false;
  const hayFilas = tablas.some((t) => t.body.length > 0);
  const haySeries = (resultado.graficos ?? []).some((g) =>
    g.series.some((s) => s.datos.some((d) => d !== null)),
  );
  const hayKpi = Boolean(
    resultado.kpiOperaciones?.cumpl_des_acum || resultado.kpiMonto?.cumpl_ope_acum,
  );
  return !hayFilas && !haySeries && !hayKpi;
}

/** Columnas hoja con datos, en el orden en que las pinta `app-tabla-reporte`. */
export function columnasDato(tabla: TablaReporteResultado): ColumnaReporte[] {
  return tabla.headers
    .flatMap((fila) => (fila?.columns ?? []).filter((c): c is ColumnaReporte => c != null))
    .filter((c) => c.isdata != null)
    .sort(
      (a, b) => (a.ordenPresentacion ?? a.isdata ?? 0) - (b.ordenPresentacion ?? b.isdata ?? 0),
    );
}

/** Número del motor: `number` tal cual, o texto estrictamente numérico. Lo demás no es cifra. */
export function aNumero(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor === 'string' && /^-?\d+(\.\d+)?$/.test(valor.trim()))
    return Number(valor.trim());
  return null;
}

/** Mismo formato que `app-tabla-reporte`, para que KPI y tabla muestren idéntica cifra. */
export function formatearValor(valor: unknown, columna: ColumnaReporte): string {
  if (valor === null || valor === undefined || valor === '') return '';
  switch (columna.format?.['type']) {
    case 'number':
      return typeof valor === 'number'
        ? new Intl.NumberFormat('es-PE').format(valor)
        : String(valor);
    case 'percent':
      return typeof valor === 'number'
        ? new Intl.NumberFormat('es-PE', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }).format(valor)
        : String(valor);
    default:
      return String(valor);
  }
}
