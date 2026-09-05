import { hexARgb, luminancia, rgbAHex, type Rgb } from '../core/preferencias/dominio/color.util';

/**
 * Aritmética de contraste y de percepción de color, para verificar que la
 * paleta del sistema sea legible. Son funciones puras; las consumen los tests
 * de `tokens.paleta.spec.ts` y de la paleta de gráficos.
 *
 * Las fórmulas son las estándar: contraste WCAG 2.1, espacio OKLab/OKLCH para
 * la separación perceptual y las matrices de Machado, Oliveira y Fernandes
 * (2009) para simular daltonismo.
 */

// ─── Contraste WCAG ─────────────────────────────────────────────────────────

/** Umbrales de la WCAG 2.1 que usa el sistema. */
export const CONTRASTE = {
  /** Texto normal, nivel AA. */
  textoAA: 4.5,
  /** Texto grande (>= 18.66px en negrita o >= 24px), nivel AA. */
  textoGrandeAA: 3,
  /** Componentes de interfaz y bordes de control (WCAG 1.4.11). */
  interfaz: 3,
} as const;

/**
 * Razón de contraste WCAG entre dos colores, de 1 (idénticos) a 21
 * (blanco sobre negro). Ambos tienen que ser opacos: para un color con alfa,
 * componelo antes con `componerSobre()`.
 */
export function contraste(colorA: string, colorB: string): number | null {
  const a = luminancia(colorA);
  const b = luminancia(colorB);
  if (a === null || b === null) return null;

  const [alto, bajo] = a > b ? [a, b] : [b, a];
  return (alto + 0.05) / (bajo + 0.05);
}

/**
 * Compone un color con alfa sobre un fondo opaco y devuelve el hex resultante.
 *
 * Hace falta porque buena parte de los tokens del sistema son `rgba(...)`
 * —bordes, superficies de vidrio, hover— y el contraste solo se puede medir
 * sobre un color ya resuelto.
 */
export function componerSobre(color: string, fondo: string): string | null {
  const capa = aRgba(color);
  const base = hexARgb(fondo);
  if (!capa || !base) return null;

  return rgbAHex({
    r: capa.r * capa.a + base.r * (1 - capa.a),
    g: capa.g * capa.a + base.g * (1 - capa.a),
    b: capa.b * capa.a + base.b * (1 - capa.a),
  });
}

interface Rgba extends Rgb {
  a: number;
}

/** Acepta `#rgb`, `#rrggbb`, `rgb(...)`, `rgba(...)` y `transparent`. */
export function aRgba(color: string): Rgba | null {
  const texto = color.trim();

  if (texto.toLowerCase() === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  const funcional = /^rgba?\(([^)]+)\)$/i.exec(texto);
  if (funcional) {
    const partes = funcional[1].split(/[,/]/).map((p) => p.trim());
    if (partes.length < 3) return null;
    const [r, g, b] = partes.slice(0, 3).map(Number);
    const a = partes.length > 3 ? Number(partes[3]) : 1;
    if ([r, g, b, a].some(Number.isNaN)) return null;
    return { r, g, b, a };
  }

  const rgb = hexARgb(texto);
  return rgb ? { ...rgb, a: 1 } : null;
}

// ─── OKLab / OKLCH ──────────────────────────────────────────────────────────

export interface Oklch {
  /** Luminosidad perceptual, 0 a 1. */
  l: number;
  /** Croma: por debajo de ~0.10 el tono se lee como gris. */
  c: number;
  /** Tono en grados. */
  h: number;
}

const aLineal = (canal: number): number =>
  canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;

const aGamma = (canal: number): number => {
  const v = Math.min(1, Math.max(0, canal));
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
};

/** sRGB 0–255 → lineal 0–1. */
function linealDe(hex: string): [number, number, number] | null {
  const rgb = hexARgb(hex);
  if (!rgb) return null;
  return [aLineal(rgb.r / 255), aLineal(rgb.g / 255), aLineal(rgb.b / 255)];
}

/** Coordenadas OKLab de un color lineal. */
function oklabDeLineal([r, g, b]: [number, number, number]): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function aOklch(hex: string): Oklch | null {
  const lineal = linealDe(hex);
  if (!lineal) return null;
  const [l, a, b] = oklabDeLineal(lineal);
  return { l, c: Math.hypot(a, b), h: (Math.atan2(b, a) * 180) / Math.PI };
}

/**
 * Distancia perceptual entre dos colores (Delta E en OKLab, ×100).
 *
 * Es la métrica con la que se decide si dos series de un gráfico se distinguen:
 * por debajo de 15 un lector sin problemas de visión ya no las separa.
 */
export function distanciaPerceptual(hexA: string, hexB: string): number | null {
  const a = linealDe(hexA);
  const b = linealDe(hexB);
  if (!a || !b) return null;

  const [l1, a1, b1] = oklabDeLineal(a);
  const [l2, a2, b2] = oklabDeLineal(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2) * 100;
}

// ─── Daltonismo ─────────────────────────────────────────────────────────────

export type TipoDaltonismo = 'protanopia' | 'deuteranopia' | 'tritanopia';

/** Matrices de Machado, Oliveira y Fernandes (2009), severidad 1.0, en RGB lineal. */
const MATRICES: Record<TipoDaltonismo, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

/** Cómo ve ese color alguien con el tipo de daltonismo indicado. */
export function simularDaltonismo(hex: string, tipo: TipoDaltonismo): string | null {
  const lineal = linealDe(hex);
  if (!lineal) return null;

  const m = MATRICES[tipo];
  const transformado = m.map((fila) => fila.reduce((suma, peso, i) => suma + peso * lineal[i], 0));
  return rgbAHex({
    r: aGamma(transformado[0]) * 255,
    g: aGamma(transformado[1]) * 255,
    b: aGamma(transformado[2]) * 255,
  });
}

/** La menor distancia perceptual entre dos colores entre visión normal y los tres daltonismos. */
export function separacionMinima(hexA: string, hexB: string): number | null {
  const normal = distanciaPerceptual(hexA, hexB);
  if (normal === null) return null;

  const tipos: TipoDaltonismo[] = ['protanopia', 'deuteranopia', 'tritanopia'];
  const distancias = [normal];
  for (const tipo of tipos) {
    const a = simularDaltonismo(hexA, tipo);
    const b = simularDaltonismo(hexB, tipo);
    const d = a && b ? distanciaPerceptual(a, b) : null;
    if (d !== null) distancias.push(d);
  }
  return Math.min(...distancias);
}
