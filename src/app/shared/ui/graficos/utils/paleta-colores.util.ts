/** Colores corporativos y tokens de tema para Highcharts. */

/** Paleta de series de reportes mixtos. */
export const NAVY = '#0A4681';
// Magenta oficial aclarado 10%: el par saldo/vencido supera Delta E 8
// bajo daltonismo; la paleta genérica conserva el valor oficial exacto.
export const MAGENTA = '#C0326E';
export const NARANJA = '#F28F16';
export const AZUL = '#009FE3';

/** Paleta de series genéricas con colores únicos y diferenciados. */
export const PALETA_SERIES = [NAVY, '#FABF35', '#B91B5E', '#8DBF3A', AZUL, NARANJA] as const;

/** Paleta de los tramos de mora del dashboard del analista. */
/**
 * Tramos de mora del dashboard del analista: es una escala ORDENADA, así que lo
 * que tiene que separarse es cada tramo del siguiente. El ocre y el gris no son
 * los originales: `#B45309` quedaba a Delta E 9.9 del rojo de al lado y
 * `#334155` desaparecía sobre el fondo oscuro del gráfico (1.57:1).
 */
export const PALETA_TRAMOS = [
  '#16A34A',
  '#0094EA',
  '#B8860B',
  '#DC2626',
  '#8040EE',
  '#606B7A',
] as const;

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
