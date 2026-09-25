/**
 * Filas de esqueleto que pinta una tabla compartida mientras espera sus datos (carga
 * independiente: el overlay global se retira con la primera respuesta y cada tabla que sigue
 * esperando muestra esto en su lugar, en vez de "Sin datos").
 */
export const FILAS_ESQUELETO = [0, 1, 2, 3, 4, 5] as const;

/** Clase de la barra animada de cada celda de esqueleto. */
export const CLASE_BARRA_ESQUELETO = 'h-3 rounded bg-[var(--mis-border-strong)] animate-pulse';
