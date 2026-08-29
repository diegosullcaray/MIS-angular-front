/**
 * Colores corporativos de Financiera Confianza y tokens de tema para Highcharts.
 *
 * Highcharts no resuelve variables CSS dentro de su configuración, así que los valores de
 * `tokens.css` se repiten acá en hexadecimal. Este archivo es el único lugar donde viven:
 * antes estaban copiados en `grafico-highcharts`, `grafico-reporte` y `principal` (analista).
 */

/** Paleta por rol de serie de los reportes mixtos (legado `agro-mix-d.component.ts`). */
export const NAVY = '#003f5c';
export const MAGENTA = '#bc5090';
export const NARANJA = '#ff7c43';
export const AMBAR = '#ffa600';
export const AZUL = '#2f9bd8';

/** Azul/navy del sistema — KPIs y series destacadas del dashboard. */
export const COLOR_PRIMARY = '#1D396E';
export const COLOR_SECONDARY = '#00A2FF';

/** Paleta de series genéricas con colores únicos y diferenciados. */
export const PALETA_SERIES = [
  '#0284C7', // Azul cielo
  '#10B981', // Esmeralda / Verde
  '#F59E0B', // Ámbar / Dorado
  '#8B5CF6', // Violeta
  '#EC4899', // Rosa
  '#06B6D4', // Cyan
  '#F97316', // Naranja
  '#14B8A6', // Teal
  '#6366F1', // Índigo
  '#84CC16', // Lima
] as const;

/** Paleta de los tramos de mora del dashboard del analista. */
export const PALETA_TRAMOS = ['#16A34A', '#00A2FF', '#B45309', '#DC2626', '#7C3AED', '#334155'] as const;

/** Tokens de tema resueltos para Highcharts (equivalen a `--mis-*` de `tokens.css`). */
export interface TokensTema {
  /** Fondo del gráfico y del tooltip. */
  fondo: string;
  /** Texto secundario: ejes y leyenda. */
  texto: string;
  /** Texto primario: contenido del tooltip y hover de la leyenda. */
  textoFuerte: string;
  /** Grillas, bordes de eje y del tooltip. */
  linea: string;
}

const TEMA_CLARO: TokensTema = {
  fondo: '#FFFFFF',
  texto: '#5A6A85',
  textoFuerte: '#304156',
  linea: 'rgba(90,106,133,0.12)',
};

const TEMA_OSCURO: TokensTema = {
  fondo: '#162034',
  texto: '#A3B2C9',
  textoFuerte: '#E8EEF9',
  linea: 'rgba(163,178,201,0.12)',
};

/** Tokens del tema activo. */
export function tokensTema(oscuro: boolean): TokensTema {
  return oscuro ? TEMA_OSCURO : TEMA_CLARO;
}

/** Una serie es de porcentaje (va como spline al eje secundario) si su nombre trae "%". */
export function esPorcentaje(nombre: string): boolean {
  return nombre.includes('%');
}

/**
 * Color de una serie de reporte mixto según su rol y su nombre — mismas reglas que el legado:
 * la métrica base va navy (magenta si es de vencidos) y su porcentaje naranja (ámbar si es de
 * vencidos). Una serie sola va azul.
 */
export function colorSerieReporte(nombre: string, unicaSerie: boolean): string {
  const n = (nombre ?? '').toLowerCase();
  if (unicaSerie) return AZUL;
  if (n === 'clientes') return AZUL;
  if (n === 'saldo vencido' || n === 'saldovencido') return MAGENTA;
  if (n === 'saldo') return NAVY;
  if (n.includes('participación') || n.includes('participacion')) return MAGENTA;
  if (n.includes('respecto al total') || n.includes('respecto')) return NARANJA;
  if (n.includes('vencido') || n.includes('mora')) return esPorcentaje(nombre) ? NARANJA : MAGENTA;
  if (esPorcentaje(nombre)) return NARANJA;
  return NAVY;
}
