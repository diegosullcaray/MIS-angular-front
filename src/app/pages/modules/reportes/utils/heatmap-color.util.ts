/**
 * Rampa secuencial (un solo hue, pasos monótonos) para el heatmap de
 * Usabilidad — validada con `validate_palette.js --ordinal` de la skill
 * `dataviz` contra la superficie real de tarjeta del Host (`--mis-panel-bg`
 * claro/oscuro). Índice 0 = paso más claro, último índice = paso más oscuro.
 */
const RAMPA_CLARO = ['#2AA8FF', '#0F8AE0', '#0A6EB8', '#075690', '#033868'];
const RAMPA_OSCURO = ['#D6F0FF', '#7FCFFF', '#3AA8F0', '#2A72B8', '#2C5C97'];

function hexARgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function interpolar(rampa: string[], t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  const pos = clamped * (rampa.length - 1);
  const i = Math.floor(pos);
  const frac = pos - i;
  const [r1, g1, b1] = hexARgb(rampa[i]);
  const [r2, g2, b2] = hexARgb(rampa[Math.min(i + 1, rampa.length - 1)]);
  const mezclar = (a: number, b: number) => Math.round(a + (b - a) * frac);
  return `rgb(${mezclar(r1, r2)}, ${mezclar(g1, g2)}, ${mezclar(b1, b2)})`;
}

/**
 * Color de una celda del heatmap según su magnitud normalizada (`valor / max`).
 * En modo oscuro los extremos se invierten (el paso más claro de `RAMPA_OSCURO`
 * es el de mayor magnitud) para que las celdas de mayor valor sigan siendo las
 * más luminosas contra la superficie oscura — "flips anchor in dark" de la
 * skill `dataviz`.
 */
export function colorCeldaHeatmap(valor: number, max: number, oscuro: boolean): string {
  if (max <= 0) return oscuro ? RAMPA_OSCURO[0] : RAMPA_CLARO[0];
  const t = valor / max;
  return oscuro ? interpolar(RAMPA_OSCURO, 1 - t) : interpolar(RAMPA_CLARO, t);
}
