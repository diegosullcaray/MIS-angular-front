import type { ColumnaReporte } from '../models/tabla-reporte.model';

/**
 * Decimales de un `format.mode` del backend, en la notación `digitsInfo` de `DecimalPipe`:
 * `"{enteros}.{mínimo}-{máximo}"` (`".0-0"`, `"1.1-2"`). Sin `mode`, o uno que no se entiende,
 * se usan los decimales por defecto de la columna.
 */
function decimalesDeModo(
  modo: unknown,
  porDefecto: { min: number; max: number },
): { enteros: number; min: number; max: number } {
  const m = typeof modo === 'string' ? /^(\d+)?\.(\d+)-(\d+)$/.exec(modo.trim()) : null;
  if (!m) return { enteros: 1, ...porDefecto };
  const min = Number(m[2]);
  return { enteros: Math.max(1, Number(m[1] ?? 1)), min, max: Math.max(min, Number(m[3])) };
}

/**
 * Formatea una celda de `app-tabla-reporte` con lo que declara el backend en `format`, como el
 * legado: `mode` son los decimales en notación de `DecimalPipe` (`".0-0"` sin decimales, `"1.1-2"`
 * de 1 a 2) y `unit` una unidad que va detrás del número (`"pbs"` en las variaciones de TAPP).
 * Compartida para que quien resuma una tabla (p. ej. las tarjetas del panel del asesor) muestre la
 * cifra exactamente como la tabla.
 */
export function formatearCeldaReporte(valor: unknown, columna: ColumnaReporte): string {
  if (valor === null || valor === undefined || valor === '') return '';
  const formato = columna.format ?? {};
  const tipo = formato['type'];
  if ((tipo !== 'number' && tipo !== 'percent') || typeof valor !== 'number') return String(valor);

  const decimales = decimalesDeModo(formato['mode'], tipo === 'percent' ? { min: 1, max: 1 } : { min: 0, max: 3 });
  const texto = new Intl.NumberFormat('es-PE', {
    ...(tipo === 'percent' ? { style: 'percent' } : {}),
    minimumIntegerDigits: decimales.enteros,
    minimumFractionDigits: decimales.min,
    maximumFractionDigits: decimales.max,
  }).format(valor);
  const unidad = formato['unit'];
  return typeof unidad === 'string' && unidad ? `${texto} ${unidad}` : texto;
}
