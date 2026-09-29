import { TABLA_PENDIENTE, type ColumnaReporte, type TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type {
  BloquePanelAsesor,
  ClaveTabla,
  ReportePanelAsesor,
  ResultadoPanelAsesor,
} from '../models/panel-asesor.model';

export const CLAVES_TABLA: readonly ClaveTabla[] = ['tabla1', 'tabla2', 'tabla3', 'tabla4', 'tabla5'];

/** Bloques a pintar: los declarados que llegaron, o todas las tablas presentes en orden. */
export function bloquesDe(
  reporte: ReportePanelAsesor,
  resultado: ResultadoPanelAsesor,
): BloquePanelAsesor[] {
  const declarados: readonly BloquePanelAsesor[] =
    reporte.bloques ?? CLAVES_TABLA.map((tabla) => ({ tabla }));
  const presentes = declarados.filter((b) => resultado[b.tabla] !== undefined);
  // Sin título propio va el del reporte, numerado si hay varias.
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

/** Vacío real: ni filas, ni series con datos, ni KPI. */
export function sinDatos(resultado: ResultadoPanelAsesor): boolean {
  const tablas = CLAVES_TABLA.map((c) => resultado[c]).filter((t) => t !== undefined);
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
