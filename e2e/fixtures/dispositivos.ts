/**
 * Matriz de dispositivos móviles reales para los tests de responsive.
 *
 * Son los viewports en puntos CSS (no en píxeles físicos), que es lo que ve el
 * layout. Están ordenados de más angosto a más ancho: el primero es el caso
 * duro y el que más encuentra.
 */
export interface Dispositivo {
  readonly nombre: string;
  readonly so: 'android' | 'ios';
  readonly ancho: number;
  readonly alto: number;
  /** `true` en los que están por encima del breakpoint `sm` (640px) de Tailwind. */
  readonly esTablet?: boolean;
}

export const DISPOSITIVOS: readonly Dispositivo[] = [
  // ── Android ───────────────────────────────────────────────────────────────
  // El más angosto que se vende: si algo desborda, desborda acá primero.
  { nombre: 'Galaxy Z Fold (plegado)', so: 'android', ancho: 280, alto: 653 },
  { nombre: 'Galaxy S8 / gama baja', so: 'android', ancho: 360, alto: 740 },
  { nombre: 'Galaxy A54', so: 'android', ancho: 384, alto: 854 },
  { nombre: 'Pixel 5', so: 'android', ancho: 393, alto: 851 },
  { nombre: 'Pixel 7', so: 'android', ancho: 412, alto: 915 },
  { nombre: 'Galaxy S20 Ultra', so: 'android', ancho: 412, alto: 915 },

  // ── iOS ───────────────────────────────────────────────────────────────────
  { nombre: 'iPhone SE (2ª/3ª gen)', so: 'ios', ancho: 375, alto: 667 },
  { nombre: 'iPhone 13 mini', so: 'ios', ancho: 375, alto: 812 },
  { nombre: 'iPhone 14 / 15', so: 'ios', ancho: 390, alto: 844 },
  { nombre: 'iPhone 14 Pro', so: 'ios', ancho: 393, alto: 852 },
  { nombre: 'iPhone 15 Pro Max', so: 'ios', ancho: 430, alto: 932 },

  // ── Tablets: cruzan el breakpoint `sm` y activan el layout de escritorio ──
  { nombre: 'iPad mini (vertical)', so: 'ios', ancho: 768, alto: 1024, esTablet: true },
  { nombre: 'iPad Pro 11" (vertical)', so: 'ios', ancho: 834, alto: 1194, esTablet: true },
];

/** Solo los teléfonos: por debajo del breakpoint `sm` de Tailwind. */
export const TELEFONOS = DISPOSITIVOS.filter((d) => !d.esTablet);

/** El más angosto de la matriz — el que se usa cuando alcanza con un solo caso. */
export const MAS_ANGOSTO = TELEFONOS[0];
