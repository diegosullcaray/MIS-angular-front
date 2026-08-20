/** Formato de cifras para las tablas y tarjetas de los módulos. */
const LOCALE = 'es-PE';

/** Número con separador de miles; `decimales` es el máximo, no el fijo. */
export function formatearNumero(valor: number, decimales = 2): string {
  return valor.toLocaleString(LOCALE, { maximumFractionDigits: decimales });
}

/** Fracción a porcentaje: `0.1234` → `"12.34%"`. */
export function formatearPorcentaje(valor: number, decimales = 2): string {
  return `${formatearNumero(valor * 100, decimales)}%`;
}

/** Monto en soles: `1234.5` → `"S/. 1,234.5"`. */
export function formatearSoles(valor: number, decimales = 2): string {
  return `S/. ${formatearNumero(valor, decimales)}`;
}
