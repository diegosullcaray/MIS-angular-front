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
  /**
   * `true` si el recorrido habla del panel de novedades y necesita verlo.
   *
   * El resto **se cierra el panel antes de arrancar**: los pasos señalan cosas
   * de la pantalla y el panel, que en angosto ocupa todo el ancho, taparía
   * justo lo que quiere mostrar.
   */
  requierePanel?: boolean;
}
