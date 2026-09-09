import type { DriveStep } from 'driver.js';

/**
 * Una mejora del sistema listada en el panel de novedades del Home. Cada una
 * trae su propio recorrido guiado: al elegirla, el tour resalta en pantalla lo
 * que la novedad cuenta.
 */
export interface Novedad {
  id: string;
  titulo: string;
  /** Una línea: qué cambió, en palabras del usuario. */
  resumen: string;
  /** Ícono de PrimeIcons que acompaña al título en la lista. */
  icono: string;
  /** Cuándo se publicó, para ordenar y para la etiqueta "Nuevo". */
  fecha: string;
  /** Los pasos del recorrido guiado. */
  pasos: DriveStep[];
}
