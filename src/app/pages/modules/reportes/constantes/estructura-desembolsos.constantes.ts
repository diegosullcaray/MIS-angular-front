/** Escala de distribución: del menor valor al mayor, según el legado. */
export const ESCALA_ESTRUCTURA_DESEMBOLSOS = [1, 2, 3, 4, 5].map((n) => ({
  bg: `var(--mis-escala-${n})`,
  borde: `var(--mis-escala-${n}-borde)`,
  text: `var(--mis-escala-${n}-texto)`,
}));

/** Fila de distribución porcentual (`IDRango` 12). */
export const ID_RANGO_DISTRIBUCION = 12;
