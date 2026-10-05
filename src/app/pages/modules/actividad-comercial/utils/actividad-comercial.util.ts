import type { DatosColumnasApiladas } from '../../../../shared/ui/graficos/models/grafico-comun.model';
import type { ColumnasCartera, FormatoKpi, SegmentoColumna } from '../models/actividad-comercial.model';

/** Porcentaje de `valor` sobre `total`, acotado a 0–100. Sin total no hay avance. */
export function porcentaje(valor: number, total: number): number {
  if (!Number.isFinite(valor) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, (valor / total) * 100));
}

/** Entero con separador de miles (`184,650`); el signo menos tipográfico lo pone `formatearDelta`. */
export function formatearEntero(valor: number): string {
  return Math.round(valor).toLocaleString('en-US');
}

/** Valor listo para mostrar según su formato. */
export function formatearValor(valor: number, formato: FormatoKpi): string {
  switch (formato) {
    case 'porcentaje':
      return `${valor.toFixed(2)}%`;
    case 'operaciones':
      return `${formatearEntero(valor)} ops`;
    case 'asesores':
      return `${formatearEntero(valor)} ases.`;
    default:
      return formatearEntero(valor);
  }
}

/** Variación con signo explícito (`+2`, `−1`); el cero va sin signo. */
export function formatearDelta(valor: number): string {
  if (valor === 0) return '0';
  return `${valor > 0 ? '+' : '−'}${formatearEntero(Math.abs(valor))}`;
}

/** Mezcla un hexadecimal `#RRGGBB` con blanco (0 = igual, 1 = blanco); Highcharts no resuelve variables CSS ni `color-mix`. */
export function aclarar(hex: string, mezcla: number): string {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  const canal = (desplazamiento: number) => Math.round(((n >> desplazamiento) & 255) * (1 - mezcla) + 255 * mezcla);
  return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** Cuánto se aclara cada tramo respecto del color base. */
const ACLARADO_TRAMO: Record<SegmentoColumna['clave'], number> = { propia: 0, trasladada: 0.3, heredada: 0.62 };

/**
 * Datos del gráfico de columnas apiladas: "Hoy" apila sus tramos y "Cierre Anterior" es una sola columna
 * (va en la serie `propia`). Cada tramo es un tono más claro del color base de la paleta.
 */
export function datosColumnasCartera(datos: ColumnasCartera, colorBase: string): DatosColumnasApiladas {
  const faltante = faltanteMeta(datos);
  return {
    categorias: ['Hoy', 'Cierre Anterior'],
    series: datos.hoy.map((s) => ({
      nombre: s.etiqueta,
      valores: [s.valor, s.clave === 'propia' ? datos.cierreAnterior : null],
      color: aclarar(colorBase, ACLARADO_TRAMO[s.clave]),
    })),
    meta: datos.meta === undefined ? undefined : { valor: datos.meta, etiqueta: `Meta ${formatearValor(datos.meta, datos.formato)}` },
    faltan: faltante ? { desde: datos.totalHoy, etiqueta: `Faltan ${formatearValor(faltante, datos.formato)}` } : undefined,
    // La Heredada se apila como tramo extra pero no suma al total Hoy (ver governance/tasks/demo).
    totales: [formatearValor(datos.totalHoy, datos.formato), formatearValor(datos.cierreAnterior, datos.formato)],
  };
}

/** Lo que falta para la meta, sin negativos; `null` si no hay meta. */
export function faltanteMeta(datos: ColumnasCartera): number | null {
  return datos.meta === undefined ? null : Math.max(0, datos.meta - datos.totalHoy);
}

/** Avance de una variación frente a su meta: porcentaje (puede ser negativo → 0) y lo que falta. */
export function avanceVariacion(neto: number, meta: number): { avancePct: number; faltan: number } {
  return { avancePct: porcentaje(neto, meta), faltan: Math.max(0, meta - neto) };
}

/** Texto del porcentaje de avance con un decimal (`5.6%`). */
export function formatearAvance(pct: number): string {
  return `${pct.toFixed(1)}%`;
}
