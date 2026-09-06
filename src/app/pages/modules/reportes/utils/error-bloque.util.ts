import { HttpErrorResponse } from '@angular/common/http';

/**
 * Si un error se puede tratar como "este bloque no tiene datos".
 *
 * Ant responde 500 a un bloque legítimamente vacío, y dentro de un `forkJoin`
 * eso tumba el reporte entero. Se absorbe solo si el servidor contestó
 * (`status >= 400`): con `status === 0` la request nunca llegó, y taparlo con
 * una tabla vacía haría que la pantalla afirme algo que no sabe.
 */
export function esBloqueVacio(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status >= 400;
}
