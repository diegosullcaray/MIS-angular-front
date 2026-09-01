/**
 * Aritmética de color del dominio de apariencia. Son funciones puras: no tocan
 * el DOM ni Angular, y por eso viven en la capa de dominio — el adaptador que
 * escribe las variables CSS solo consume lo que sale de acá.
 */

/** Componentes 0–255 de un color. */
export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const HEX_LARGO = /^#([0-9a-f]{6})$/i;
const HEX_CORTO = /^#([0-9a-f]{3})$/i;

/** Normaliza `#abc` y `#AABBCC` a `#aabbcc`; devuelve `null` si no es un hex. */
export function normalizarHex(valor: string): string | null {
  const texto = valor.trim();

  const corto = HEX_CORTO.exec(texto);
  if (corto) {
    const [r, g, b] = corto[1].toLowerCase();
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  const largo = HEX_LARGO.exec(texto);
  return largo ? `#${largo[1].toLowerCase()}` : null;
}

/** `#aabbcc` → `{r, g, b}`. Devuelve `null` ante cualquier cosa que no sea hex. */
export function hexARgb(hex: string): Rgb | null {
  const normalizado = normalizarHex(hex);
  if (!normalizado) return null;

  return {
    r: parseInt(normalizado.slice(1, 3), 16),
    g: parseInt(normalizado.slice(3, 5), 16),
    b: parseInt(normalizado.slice(5, 7), 16),
  };
}

function aHex(componente: number): string {
  return Math.round(Math.min(255, Math.max(0, componente)))
    .toString(16)
    .padStart(2, '0');
}

/** `{r, g, b}` → `#aabbcc`. */
export function rgbAHex({ r, g, b }: Rgb): string {
  return `#${aHex(r)}${aHex(g)}${aHex(b)}`;
}

/** `#aabbcc` + alfa → `rgba(...)`, para los tokens translúcidos. */
export function hexARgba(hex: string, alfa: number): string | null {
  const rgb = hexARgb(hex);
  if (!rgb) return null;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alfa})`;
}

/** Mezcla dos colores; `peso` es cuánto del segundo entra (0 = solo el primero). */
export function mezclar(hexA: string, hexB: string, peso: number): string | null {
  const a = hexARgb(hexA);
  const b = hexARgb(hexB);
  if (!a || !b) return null;

  const p = Math.min(1, Math.max(0, peso));
  return rgbAHex({
    r: a.r + (b.r - a.r) * p,
    g: a.g + (b.g - a.g) * p,
    b: a.b + (b.b - a.b) * p,
  });
}

/** Acerca el color al blanco. */
export function aclarar(hex: string, peso: number): string | null {
  return mezclar(hex, '#ffffff', peso);
}

/** Acerca el color al negro. */
export function oscurecer(hex: string, peso: number): string | null {
  return mezclar(hex, '#000000', peso);
}

/**
 * Luminancia relativa (WCAG 2.1, §relative luminance). Se usa para una sola
 * decisión: si un fondo elegido por el usuario pide texto oscuro o claro
 * encima. El umbral 0.5 es el que separa "claro" de "oscuro" a ojo.
 */
export function luminancia(hex: string): number | null {
  const rgb = hexARgb(hex);
  if (!rgb) return null;

  const canal = (valor: number): number => {
    const v = valor / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * canal(rgb.r) + 0.7152 * canal(rgb.g) + 0.0722 * canal(rgb.b);
}

/** `true` si sobre ese color conviene texto oscuro. */
export function esColorClaro(hex: string): boolean {
  const l = luminancia(hex);
  return l !== null && l > 0.5;
}

/** Color de texto legible sobre `hex` — el mismo criterio que `esColorClaro`. */
export function textoSobre(hex: string): string {
  return esColorClaro(hex) ? '#0f1e2e' : '#ffffff';
}
