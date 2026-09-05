/** Colores corporativos y tokens de tema para Highcharts. */

/** Paleta de series de reportes mixtos. */
export const NAVY = '#003f5c';
export const MAGENTA = '#bc5090';
export const NARANJA = '#ff7c43';
export const AZUL = '#2f9bd8';

/** Azul/navy del sistema — KPIs y series destacadas del dashboard. */
export const COLOR_PRIMARY = '#1D396E';
export const COLOR_SECONDARY = '#0094EA';

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
  '#6AA312', // Lima
] as const;

/** Paleta de los tramos de mora del dashboard del analista. */
/**
 * Tramos de mora del dashboard del analista: es una escala ORDENADA, así que lo
 * que tiene que separarse es cada tramo del siguiente. El ocre y el gris no son
 * los originales: `#B45309` quedaba a Delta E 9.9 del rojo de al lado y
 * `#334155` desaparecía sobre el fondo oscuro del gráfico (1.57:1).
 */
export const PALETA_TRAMOS = ['#16A34A', '#0094EA', '#B8860B', '#DC2626', '#8040EE', '#606B7A'] as const;

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

/** Color de una serie de reporte mixto según su rol. */
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
