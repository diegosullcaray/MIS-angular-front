import { HttpErrorResponse } from '@angular/common/http';

/**
 * Si un error se puede tratar como "este bloque no tiene datos".
 *
 * El backend Ant responde **HTTP 500 a un bloque legítimamente vacío**. Dentro
 * de un `forkJoin` eso tumba el reporte entero, así que varias consultas lo
 * absorben y devuelven una tabla vacía. El problema de absorber *todo* es que
 * una caída de red se ve igual que un bloque sin datos: la pantalla dice "sin
 * información" cuando en realidad nunca se llegó a preguntar.
 *
 * La línea se traza en si el servidor llegó a contestar:
 *
 * - `status >= 400` — Ant contestó. Puede ser un bloque vacío; se absorbe.
 * - `status === 0` — la request nunca llegó (red caída, CORS, cancelada, o el
 *   navegador la abortó). Eso NO es un bloque vacío y tiene que propagarse.
 * - Cualquier otro error (uno de mapeo, por ejemplo) tampoco se absorbe: es un
 *   bug nuestro y esconderlo detrás de una tabla vacía lo vuelve invisible.
 */
export function esBloqueVacio(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status >= 400;
}
